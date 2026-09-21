const express = require("express");
const logger = require("firebase-functions/logger");

const { CURRENCY, STRIPE_WEBHOOK_SECRET } = require("../config/env");
const { requireUser } = require("../middleware/requireUser");
const { priceServices } = require("../services/catalog");
const {
  ORDER_STATUS,
  attachPayment,
  checkoutRef,
  finishCheckout,
  orderRef,
  releaseCheckout,
  replyForInFlight,
  settledReply,
  slotTakenReply,
  startCheckout,
} = require("../services/orders");
const { claimSlots, employeeNameFor, parseSlotPaths, readOpenSlots, restoreSlots } = require("../services/slots");
const { customerIdFor, ownedCard, stripe } = require("../services/stripe");
const { ERROR_CODE, HttpError } = require("../utils/httpError");
const { isRecord, text, toNumber, SAFE_KEY } = require("../utils/values");

/**
 * Booking with a retainer. A saved card secures every booking, and the
 * retainer — the catalog's deposit percentage of the total — is charged to
 * it when booking.
 *
 *   POST /checkout                    take the time, charge, write the order
 *   POST /checkout/:orderId/complete  finish after the page has handled 3-D Secure
 *   POST /stripe/webhook              Stripe's confirmation that a charge succeeded
 *
 * The time comes off the calendar before the card is charged. A charge that
 * fails then costs nothing to undo — the slots go straight back — where
 * charging first would mean refunding, and a refund keeps Stripe's fee.
 *
 * The page generates each attempt's `orderId`. Sending it again — a double
 * tap, a retried request — returns the first attempt's outcome instead of
 * taking the time twice or charging twice.
 */
const router = express.Router();

// A v4 UUID, as crypto.randomUUID() makes in the browser.
const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MS_PER_MINUTE = 60 * 1000;
const NOTE_MAX = 500;

/** Name, phone and an optional note; email comes from the sign-in, never the form. */
function toContact(raw, user) {
  const contact = isRecord(raw) ? raw : {};
  const name = text(contact.name) || user.name;
  const phone = text(contact.phone);
  const digits = phone.replace(/\D/g, "");
  const note = text(contact.note);
  if (!name || name.length > 80) throw new HttpError(400, "Enter your name.");
  if (digits.length < 7 || digits.length > 15) throw new HttpError(400, "Enter a phone number the studio can reach you on.");
  if (note.length > NOTE_MAX) throw new HttpError(400, `Keep the note under ${NOTE_MAX} characters.`);
  return { name, email: user.email, phone, note };
}

router.post("/checkout", requireUser, async (req, res) => {
  const body = isRecord(req.body) ? req.body : {};
  const uid = req.user.uid;
  const orderId = text(body.orderId);
  if (!ORDER_ID.test(orderId)) throw new HttpError(400, "Something went wrong starting your booking. Refresh and try again.");

  // A resent id — a double tap, or a retry after the reply was lost — gets
  // the first attempt's outcome. Checked before anything else: that attempt
  // may already hold the very slots this one would otherwise be told are gone.
  const booked = settledReply((await orderRef(uid, orderId).once("value")).val(), orderId);
  if (booked) return res.status(booked.status).json(booked.body);

  const inFlight = (await checkoutRef(uid, orderId).once("value")).val();
  if (isRecord(inFlight)) {
    const existing = await replyForInFlight(uid, orderId, inFlight);
    return res.status(existing.status).json(existing.body);
  }

  // The checkbox. Recorded on the order with the percentage and amount it agreed to.
  if (body.retainerAccepted !== true) throw new HttpError(400, "Please confirm the retainer to book.");

  const contact = toContact(body.contact, req.user);
  const pricing = await priceServices(body.serviceIds);
  // The amount the client agreed to must be the amount charged. A price can
  // change in the admin while someone's mid-booking.
  if (toNumber(body.retainerAmount) !== pricing.retainer.amount) {
    throw new HttpError(
      409,
      "The price changed while you were booking. Check the new total, then book again.",
      ERROR_CODE.PRICE_CHANGED,
    );
  }

  const { monthKey, paths, keys } = parseSlotPaths(body.eventKeys);
  const slots = await readOpenSlots(monthKey, keys);

  // A card on file is what secures the booking — required even when there's
  // no retainer to charge, and checked before the time comes off the calendar.
  const customerId = await customerIdFor(req.user);
  const card = await ownedCard(customerId, text(body.paymentMethodId));
  if (!card) throw new HttpError(400, "Choose one of your saved cards.");

  // 1. The time comes off the calendar, with a copy of each slot kept to put
  //    back if this booking doesn't happen.
  const claimed = await claimSlots(monthKey, keys);
  if (!claimed) {
    const taken = slotTakenReply();
    return res.status(taken.status).json(taken.body);
  }

  const start = slots[0].start;
  const now = Date.now();
  const checkout = {
    status: ORDER_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
    appointment: {
      start: start.toISOString(),
      end: new Date(start.getTime() + pricing.totalDuration * MS_PER_MINUTE).toISOString(),
      employeeId: slots[0].employeeId,
      employeeName: await employeeNameFor(slots[0].employeeId),
      eventKeys: paths,
      services: pricing.services,
      totalPrice: pricing.totalPrice,
      totalDuration: pricing.totalDuration,
    },
    contact,
    payment: {
      currency: CURRENCY,
      percent: pricing.retainer.percent,
      amount: pricing.retainer.amount,
      refundable: pricing.retainer.refundable,
      acceptedAt: new Date(now).toISOString(),
      card: { id: card.id, brand: card.card.brand, last4: card.card.last4 },
    },
    slots: { monthKey, claimed },
  };

  // Written only if this id is still new — the check and the write in one
  // step, so two copies of the request arriving together can't both charge.
  const raced = await startCheckout(uid, orderId, checkout);
  if (raced) {
    // The other copy is doing this booking; give back what this one took.
    await restoreSlots(monthKey, claimed);
    const existing = await replyForInFlight(uid, orderId, raced);
    return res.status(existing.status).json(existing.body);
  }

  if (pricing.retainer.amount === 0) {
    const result = await finishCheckout(uid, orderId);
    return res.status(result.status).json(result.body);
  }

  // 2. The card is charged.
  let intent;
  try {
    intent = await stripe().paymentIntents.create(
      {
        amount: pricing.retainer.amount * 100,
        currency: CURRENCY,
        customer: customerId,
        payment_method: card.id,
        payment_method_types: ["card"],
        confirm: true,
        description: `Retainer (${pricing.retainer.percent}%) — ${pricing.services.map((service) => service.name).join(", ")}`,
        metadata: { firebaseUid: uid, orderId },
        receipt_email: req.user.email || undefined,
      },
      { idempotencyKey: `retainer-${orderId}` },
    );
  } catch (error) {
    const declined = Boolean(error) && error.type === "StripeCardError";
    await releaseCheckout(uid, orderId, checkout, declined ? "card declined" : "charge could not be started");
    if (declined) throw new HttpError(402, error.message || "Your card was declined.");
    throw error;
  }
  await attachPayment(uid, orderId, { "payment/paymentIntentId": intent.id });

  if (intent.status === "requires_action") {
    // The bank wants the client to approve it. The time stays off the
    // calendar until they do, or until a later request finds it refused.
    await attachPayment(uid, orderId, { status: ORDER_STATUS.REQUIRES_ACTION });
    return res.json({ status: ORDER_STATUS.REQUIRES_ACTION, orderId, clientSecret: intent.client_secret });
  }
  if (intent.status !== "succeeded") {
    await releaseCheckout(uid, orderId, checkout, `charge ${intent.status}`);
    throw new HttpError(402, "The payment didn't go through. Try another card.");
  }

  // 3. The order is written, and the studio gets its booking.
  const result = await finishCheckout(uid, orderId);
  return res.status(result.status).json(result.body);
});

router.post("/checkout/:orderId/complete", requireUser, async (req, res) => {
  const orderId = text(req.params.orderId);
  if (!ORDER_ID.test(orderId)) throw new HttpError(400, "That booking isn't valid.");
  const result = await finishCheckout(req.user.uid, orderId);
  res.status(result.status).json(result.body);
});

/**
 * Stripe's word that a charge succeeded. Normally the page has finished the
 * booking already and this just finds it done; it matters when the page
 * didn't — the tab closed after 3-D Secure, the connection dropped — so a
 * paid retainer never goes without its booking, and the time it is holding
 * never sits off the calendar with nothing to show for it.
 */
router.post("/stripe/webhook", async (req, res) => {
  if (!STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Webhook secret isn't set." });

  let event;
  try {
    // req.rawBody: the signature covers the exact bytes Stripe sent, which the
    // functions runtime keeps alongside the parsed body.
    event = stripe().webhooks.constructEvent(req.rawBody, req.get("stripe-signature"), STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ error: "Invalid signature." });
  }

  if (event.type === "payment_intent.succeeded") {
    const metadata = event.data.object.metadata || {};
    const uid = text(metadata.firebaseUid);
    const orderId = text(metadata.orderId);
    // Other charges on the account (made outside this site) carry no order.
    if (SAFE_KEY.test(uid) && ORDER_ID.test(orderId)) {
      const result = await finishCheckout(uid, orderId);
      logger.log("Webhook finalize", { orderId, status: result.status });
      // Someone else is mid-finalize: answer non-2xx so Stripe redelivers
      // later and this checks again once they've finished (or given up).
      if (result.status === 202) return res.status(503).json({ retry: true });
    }
  }
  return res.json({ received: true });
});

module.exports = router;
