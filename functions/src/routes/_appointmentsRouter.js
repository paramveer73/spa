const express = require("express");
const logger = require("firebase-functions/logger");

const { db } = require("../firebaseAdmin");
const { sendConfirmationEmail } = require("../services/emailService");
const { parsePrice } = require("../utils/formatters");

const router = express.Router();

const FREE_ROOT = "appointments/freeAppointments";
const BOOKED_ROOT = "appointments/bookedAppointments";

// The slot being booked is named by the client, and claiming it deletes
// whatever sits at that path. So it must be exactly one free slot —
// `appointments/freeAppointments/{month}/{key}` — and never a parent bucket,
// the employees node or the root. Characters Firebase keys can't contain are
// excluded so a crafted key can't slip another segment in.
const FREE_SLOT_PATH = /^appointments\/freeAppointments\/([^/.#$[\]]+)\/([^/.#$[\]]+)$/;
const SAFE_KEY = /^[^/.#$[\]]+$/;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Any date string the app has ever stored → ISO, or "" if it won't parse. */
function toIso(value) {
  const raw = text(value);
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/**
 * The services the client picked, in the stored shape. `selectedService` is
 * what the current booking page sends; `services` is accepted too, for when
 * it's renamed. Prices arrive as "$120" strings and are stored as numbers.
 */
function toServices(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(isRecord).map((item) => ({
    id: text(item.id) || text(item.uuid),
    name: text(item.name),
    description: text(item.description),
    price: parsePrice(item.price),
    durationMinutes: typeof item.durationMinutes === "number" ? item.durationMinutes : null,
  }));
}

/**
 * Takes a free slot for a client.
 *
 * The slot is claimed and deleted in one transaction, so two people submitting
 * the same time can't both succeed — the second gets 409. The booking record is
 * then written in the flat shape the admin panel reads:
 *
 *   { name, email, phone, message, start, end, employeeId, employeeName,
 *     eventKey, bookedAppointmentKey, services: [...] }
 *
 * Start, end and who it's with come from the slot as stored, not from the
 * request body, so a client can't book a different time than the one it claims.
 */
router.post("/bookappointment", async (req, res) => {
  const body = isRecord(req.body) ? req.body : {};
  const details = isRecord(body.appointmentDetails) ? body.appointmentDetails : {};

  const eventKey = text(details.eventKey);
  const name = text(body.name);
  const email = text(body.email);
  // `number` is what the current booking page sends; `phone` is the real name.
  const phone = text(body.phone) || text(body.number);
  const message = text(body.message);
  const services = toServices(Array.isArray(body.services) ? body.services : body.selectedService);

  const slotPath = FREE_SLOT_PATH.exec(eventKey);
  if (!slotPath) {
    return res.status(400).json({ error: "That appointment time isn't valid." });
  }
  if (!name || (!email && !phone)) {
    return res.status(400).json({ error: "A name and an email or phone number are required." });
  }

  // 1. Claim the slot.
  let claimed = null;
  let committed = false;
  try {
    const result = await db.ref(eventKey).transaction((current) => {
      // Reset on every attempt: RTDB can rerun this with fresher data.
      claimed = null;
      // Null can mean "not loaded yet" as well as "gone". Committing null
      // (a no-op) makes RTDB retry with the server's value if there is one.
      if (current === null) return null;
      // The old backend marked booked slots in place rather than removing
      // them. Until those are cleaned up, they exist but aren't free.
      if (isRecord(current.extra) && current.extra.status) return undefined;
      claimed = current;
      return null;
    });
    committed = result.committed;
  } catch (err) {
    logger.error("Slot claim transaction failed", err);
    return res.status(500).json({ error: "Booking failed. Please try again." });
  }

  if (!committed || !claimed) {
    return res.status(409).json({ error: "That time was just booked. Please pick another." });
  }

  // 2. Build the record from the slot as stored.
  //
  // Filed under the month bucket the slot itself was in, not one recomputed
  // from its start date: that would use this server's timezone (UTC), and a
  // late-evening slot at month end would land in the next month's bucket.
  const monthKey = slotPath[1];
  const bookedRef = db.ref(`${BOOKED_ROOT}/${monthKey}`).push();
  const bookedAppointmentKey = `${BOOKED_ROOT}/${monthKey}/${bookedRef.key}`;

  const employeeId = SAFE_KEY.test(text(claimed.employeeId)) ? text(claimed.employeeId) : "";
  // Snapshot of who it's with, so the booking still names them after a rename
  // or removal. Older slots only ever carried a name in `extra.employee`.
  let employeeName = isRecord(claimed.extra) ? text(claimed.extra.employee) : "";
  if (employeeId) {
    try {
      const staff = (await db.ref(`employees/${employeeId}`).once("value")).val();
      if (isRecord(staff) && text(staff.name)) employeeName = text(staff.name);
    } catch (err) {
      // Not worth failing a booking over; the id still links it.
      logger.warn("Couldn't read staff record for booking", { employeeId });
    }
  }

  const record = {
    name,
    email,
    phone,
    message,
    start: toIso(claimed.start),
    end: toIso(claimed.end),
    employeeId,
    employeeName,
    eventKey,
    bookedAppointmentKey,
    services,
  };

  // 3. Write it. If that fails, put the slot back — otherwise the time is gone
  //    from the calendar with no booking to show for it.
  try {
    await bookedRef.set(record);
  } catch (err) {
    logger.error("Booking record failed to write; restoring the slot", err);
    try {
      await db.ref(eventKey).set(claimed);
    } catch (restoreErr) {
      logger.error("Could not restore the claimed slot", { eventKey, restoreErr });
    }
    return res.status(500).json({ error: "Booking failed. Please try again." });
  }

  // Keys only — the log shouldn't collect clients' names and contact details.
  logger.log("Booked appointment", { bookedAppointmentKey, eventKey, employeeId });

  // 4. Confirmation email. The booking already exists, so a mail failure is
  //    reported back but doesn't turn a real booking into an error.
  let emailSent = false;
  if (email) {
    try {
      await sendConfirmationEmail({
        to: email,
        customerName: name,
        start: record.start,
        end: record.end,
        professionalName: employeeName,
        services,
      });
      emailSent = true;
    } catch (err) {
      logger.error("Booking saved but the confirmation email failed", { bookedAppointmentKey, err });
    }
  }

  return res.status(200).json({ success: true, bookedAppointmentKey, emailSent });
});

module.exports = router;
