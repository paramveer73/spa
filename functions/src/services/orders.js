const logger = require("firebase-functions/logger");

const { db } = require("../firebaseAdmin");
const { sendConfirmationEmail } = require("./emailService");
const { restoreSlots } = require("./slots");
const { stripe } = require("./stripe");
const { ERROR_CODE } = require("../utils/httpError");
const { isRecord } = require("../utils/values");

/**
 * A booking in two places, in this order: the time comes off the calendar
 * first, the card is charged second, and only then is the order written.
 *
 * Taking the time first means a card that fails costs nothing to undo — the
 * slots go straight back. Charging first would mean refunding, and a refund
 * keeps Stripe's fee.
 *
 * While that is happening the checkout lives at
 * `users/{uid}/checkouts/{orderId}`, carrying a copy of every slot that was
 * removed. It exists because "held in memory" doesn't survive a crash and
 * doesn't reach the second request 3-D Secure needs: any path that ends
 * without a booking reads that copy and puts the time back. It is deleted the
 * moment the booking is written, so `users/{uid}/orders/{orderId}` — the
 * client's order — only ever holds bookings that were paid for.
 *
 * The studio's view of the same booking is written to
 * `appointments/bookedAppointments` (the shape the admin Bookings tab reads),
 * linked back by `uid` and `orderId`.
 */

const USERS_ROOT = "users";
const BOOKED_ROOT = "appointments/bookedAppointments";

const ORDER_STATUS = Object.freeze({
  /** Slots taken off the calendar; the retainer charge is being made. */
  PENDING: "pending",
  /** The bank wants the client to approve (3-D Secure); the page is showing that. */
  REQUIRES_ACTION: "requires_action",
  /** Paid; the booking is being written. Held as a lock — see finishCheckout. */
  FINALIZING: "finalizing",
  CONFIRMED: "confirmed",
  PAYMENT_FAILED: "payment_failed",
  /** The time went to someone else before the card was ever charged. */
  SLOT_TAKEN: "slot_taken",
});

// Statuses a payment intent never comes back from: the client has to start
// again, so whatever this checkout was holding is no longer worth holding.
const DEAD_INTENT = new Set(["requires_payment_method", "canceled"]);

const checkoutRef = (uid, orderId) => db.ref(`${USERS_ROOT}/${uid}/checkouts/${orderId}`);
const orderRef = (uid, orderId) => db.ref(`${USERS_ROOT}/${uid}/orders/${orderId}`);

const reply = (status, body) => ({ status, body });

/** The answer for an order that has already been made, or null if this id never got there. */
function settledReply(order, orderId) {
  if (!isRecord(order) || order.status !== ORDER_STATUS.CONFIRMED) return null;
  return reply(200, { status: order.status, orderId, bookedAppointmentKey: order.bookedAppointmentKey });
}

/**
 * Starts the checkout, atomically — the record is this order id's claim on
 * the slots it has just taken. A second request carrying the same id (a
 * double tap, a retry) doesn't get past this, so it can't take slots or
 * charge a card of its own.
 */
async function startCheckout(uid, orderId, record) {
  const result = await checkoutRef(uid, orderId).transaction((current) => (current === null ? record : undefined));
  return result.committed ? null : result.snapshot.val();
}

/** Records the charge against the checkout, so a later request can pick it up. */
async function attachPayment(uid, orderId, fields) {
  await checkoutRef(uid, orderId).update(Object.assign({ updatedAt: Date.now() }, fields));
}

/**
 * Ends a checkout that never became a booking: the slots go back on the
 * calendar and the record is dropped. Nothing is refunded here — this runs
 * only where the card was not charged, or the charge itself failed.
 */
async function releaseCheckout(uid, orderId, checkout, reason) {
  if (isRecord(checkout) && isRecord(checkout.slots) && isRecord(checkout.slots.claimed)) {
    await restoreSlots(checkout.slots.monthKey, checkout.slots.claimed);
  }
  await checkoutRef(uid, orderId).remove();
  logger.log("Checkout released", { orderId, reason });
}

/**
 * Moves an open checkout to FINALIZING, atomically. The client (after paying)
 * and Stripe's webhook (on the same payment) can both arrive at once; without
 * the lock both would write the booking, and the studio would get two.
 */
async function lockCheckout(ref) {
  let locked = false;
  await ref.child("status").transaction((status) => {
    locked = false;
    // Null may mean "not loaded yet"; committing it (a no-op) makes RTDB retry with the real value.
    if (status === null) return null;
    if (status !== ORDER_STATUS.PENDING && status !== ORDER_STATUS.REQUIRES_ACTION) return undefined;
    locked = true;
    return ORDER_STATUS.FINALIZING;
  });
  return locked;
}

/** The studio's copy, in the flat shape the admin Bookings tab reads. */
function bookingRecord(order, link) {
  const appointment = order.appointment;
  const contact = order.contact;
  const payment = order.payment;
  return {
    name: contact.name,
    email: contact.email || "",
    phone: contact.phone,
    message: contact.note || "",
    start: appointment.start,
    end: appointment.end,
    employeeId: appointment.employeeId,
    employeeName: appointment.employeeName || "",
    eventKey: appointment.eventKeys[0],
    eventKeys: appointment.eventKeys,
    bookedAppointmentKey: link.bookedAppointmentKey,
    services: appointment.services.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      durationMinutes: service.duration,
    })),
    uid: link.uid,
    orderId: link.orderId,
    retainer: {
      amount: payment.amount,
      currency: payment.currency,
      refundable: payment.refundable,
      paymentIntentId: link.paymentIntentId || "",
    },
  };
}

/** The client's own order — what the checkout becomes once it's paid and booked. */
function orderRecord(checkout, link) {
  return {
    status: ORDER_STATUS.CONFIRMED,
    createdAt: checkout.createdAt,
    confirmedAt: Date.now(),
    appointment: checkout.appointment,
    contact: checkout.contact,
    payment: checkout.payment,
    bookedAppointmentKey: link.bookedAppointmentKey,
  };
}

const CARD_BRANDS = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" };

/**
 * Emails the client their confirmation. Never throws: it runs after the
 * booking is written and the order is in, and an error escaping here would
 * undo a booking that is already the studio's.
 */
async function emailConfirmation(order, orderId) {
  try {
    if (!isRecord(order.contact) || !order.contact.email) return;
    const card = isRecord(order.payment.card) ? order.payment.card : {};
    await sendConfirmationEmail({
      to: order.contact.email,
      customerName: order.contact.name,
      start: order.appointment.start,
      end: order.appointment.end,
      professionalName: order.appointment.employeeName,
      services: order.appointment.services.map((service) => ({
        name: service.name,
        price: service.price,
        durationMinutes: service.duration,
      })),
      retainer: {
        amount: order.payment.amount,
        refundable: order.payment.refundable,
        cardLabel: card.last4 ? `${CARD_BRANDS[card.brand] || "Card"} •••• ${card.last4}` : "",
      },
    });
  } catch (error) {
    logger.error("Booking confirmed but the confirmation email failed", { orderId, message: error.message });
  }
}

/**
 * Turns a paid checkout into the booking: writes the studio's record, writes
 * the client's order, drops the checkout. Safe to call any number of times —
 * by the client after paying, again after 3-D Secure, and by the webhook —
 * since a finished order just reports how it finished.
 *
 * The slots are already off the calendar by now, so nothing here can find
 * them taken. Returns { status, body } for the HTTP reply.
 */
async function finishCheckout(uid, orderId) {
  const ref = checkoutRef(uid, orderId);
  const checkout = (await ref.once("value")).val();
  if (!isRecord(checkout) || !isRecord(checkout.appointment) || !isRecord(checkout.payment)) {
    // Nothing in flight: either this is already booked, or the id is unknown.
    const order = (await orderRef(uid, orderId).once("value")).val();
    return settledReply(order, orderId) || reply(404, { error: "We couldn't find that booking." });
  }

  let intent = null;
  if (checkout.payment.amount > 0) {
    // The first request is still creating the charge.
    if (!checkout.payment.paymentIntentId) return reply(202, { status: ORDER_STATUS.PENDING, orderId });
    intent = await stripe().paymentIntents.retrieve(checkout.payment.paymentIntentId);
    const metadata = intent.metadata || {};
    if (metadata.orderId !== orderId || metadata.firebaseUid !== uid) {
      return reply(400, { error: "That payment doesn't belong to this booking." });
    }
    if (DEAD_INTENT.has(intent.status)) {
      // The bank is done with it and said no — nothing more is coming, so the
      // time goes back on the calendar rather than sitting on a dead charge.
      await releaseCheckout(uid, orderId, checkout, `intent ${intent.status}`);
      return reply(402, { status: ORDER_STATUS.PAYMENT_FAILED, error: "The payment didn't go through. Try another card." });
    }
    if (intent.status !== "succeeded") {
      // Still with the bank. The slots stay off the calendar until it decides.
      return reply(402, {
        status: checkout.status,
        error: "The payment hasn't gone through. Approve it with your bank, or try another card.",
      });
    }
  }

  if (!(await lockCheckout(ref))) {
    const order = (await orderRef(uid, orderId).once("value")).val();
    return settledReply(order, orderId) || reply(202, { status: ORDER_STATUS.FINALIZING, orderId });
  }

  const monthKey = isRecord(checkout.slots) ? checkout.slots.monthKey : "";
  const bookedRef = db.ref(`${BOOKED_ROOT}/${monthKey}`).push();
  const bookedAppointmentKey = `${BOOKED_ROOT}/${monthKey}/${bookedRef.key}`;
  const link = { uid, orderId, bookedAppointmentKey, paymentIntentId: intent ? intent.id : "" };

  try {
    await bookedRef.set(bookingRecord(checkout, link));
    await orderRef(uid, orderId).set(orderRecord(checkout, link));
  } catch (error) {
    // Paid, but the booking wouldn't write. The time goes back on the
    // calendar and the retainer is returned — the one refund this flow can
    // still owe, and only when the database itself failed.
    logger.error("Checkout paid but the booking failed to write", { orderId, message: error.message });
    if (intent) {
      try {
        await stripe().refunds.create({ payment_intent: intent.id }, { idempotencyKey: `refund-${orderId}` });
      } catch (refundError) {
        logger.error("Refund after a failed booking write also failed", { orderId, message: refundError.message });
      }
    }
    await releaseCheckout(uid, orderId, checkout, "booking write failed");
    return reply(500, {
      status: ORDER_STATUS.PAYMENT_FAILED,
      error: "We couldn't finish your booking, so your retainer has been returned. Please try again.",
    });
  }

  await ref.remove();
  // Keys only — the log shouldn't collect clients' names and contact details.
  logger.log("Checkout confirmed", { orderId, bookedAppointmentKey });
  // Only the request holding the lock gets here, so the page and the webhook
  // finishing the same order can't both send it.
  await emailConfirmation(checkout, orderId);
  return reply(200, { status: ORDER_STATUS.CONFIRMED, orderId, bookedAppointmentKey });
}

/**
 * What to tell a client whose order id is already in flight — a double tap,
 * or a retry after a reply was lost. Never starts a second charge: either the
 * bank is still waiting on this one, or the first attempt finishes it.
 */
async function replyForInFlight(uid, orderId, checkout) {
  if (checkout.status === ORDER_STATUS.REQUIRES_ACTION && isRecord(checkout.payment) && checkout.payment.paymentIntentId) {
    const intent = await stripe().paymentIntents.retrieve(checkout.payment.paymentIntentId);
    if (intent.status === "requires_action") {
      return reply(200, { status: ORDER_STATUS.REQUIRES_ACTION, orderId, clientSecret: intent.client_secret });
    }
  }
  return finishCheckout(uid, orderId);
}

const slotTakenReply = () =>
  reply(409, {
    status: ORDER_STATUS.SLOT_TAKEN,
    code: ERROR_CODE.SLOT_UNAVAILABLE,
    error: "Someone booked that time moments before you. Please pick another time.",
  });

module.exports = {
  ORDER_STATUS,
  checkoutRef,
  orderRef,
  settledReply,
  startCheckout,
  attachPayment,
  releaseCheckout,
  finishCheckout,
  replyForInFlight,
  slotTakenReply,
};
