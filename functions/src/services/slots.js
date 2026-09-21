const logger = require("firebase-functions/logger");

const { db } = require("../firebaseAdmin");
const { ERROR_CODE, HttpError } = require("../utils/httpError");
const { isRecord, text, SAFE_KEY } = require("../utils/values");

/**
 * The open slots a booking takes. With the calendar's continuous-time filter
 * one appointment can span several back-to-back slots, so everything here
 * works on a set of them — always one professional's, on one day.
 */

const FREE_ROOT = "appointments/freeAppointments";

// Claiming deletes whatever sits at these paths, so each must be exactly one
// free slot — never a month bucket, the employees node or the root.
const FREE_SLOT_PATH = /^appointments\/freeAppointments\/([^/.#$[\]]+)\/([^/.#$[\]]+)$/;
const MAX_SLOTS = 12;

/** The slot paths from a request → their month bucket and keys. Throws 400 on anything else. */
function parseSlotPaths(eventKeys) {
  if (!Array.isArray(eventKeys) || eventKeys.length === 0 || eventKeys.length > MAX_SLOTS) {
    throw new HttpError(400, "Pick a time for your appointment.");
  }
  const matches = eventKeys.map((key) => FREE_SLOT_PATH.exec(text(key)));
  if (matches.some((match) => !match)) throw new HttpError(400, "That appointment time isn't valid.");

  // One appointment is one day, and a day's slots share a month bucket. A
  // single bucket is also what lets claimSlots take them in one transaction.
  const monthKey = matches[0][1];
  if (matches.some((match) => match[1] !== monthKey)) throw new HttpError(400, "That appointment time isn't valid.");

  const keys = Array.from(new Set(matches.map((match) => match[2])));
  return { monthKey, keys, paths: keys.map((key) => `${FREE_ROOT}/${monthKey}/${key}`) };
}

function toDate(value) {
  const date = new Date(text(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A stored slot that's still free, or null. Slots the old backend marked in place (`extra.status`) aren't. */
function toOpenSlot(key, raw) {
  if (!isRecord(raw) || (isRecord(raw.extra) && raw.extra.status)) return null;
  const start = toDate(raw.start);
  const end = toDate(raw.end);
  if (!start || !end) return null;
  const employeeId = SAFE_KEY.test(text(raw.employeeId)) ? text(raw.employeeId) : "";
  return { key, start, end, employeeId };
}

/**
 * The slots, read and checked before any money moves: all still free, one
 * professional's, back to back, and not already started. Sorted by start.
 *
 * Whether they add up to the whole appointment isn't checked: offering only
 * slots long enough is the calendar's filter, and it can be switched off
 * (FEATURE_FLAGS.CONTINUOUS_TIME_FILTER) for studios that book by start time.
 */
async function readOpenSlots(monthKey, keys) {
  const snapshots = await Promise.all(keys.map((key) => db.ref(`${FREE_ROOT}/${monthKey}/${key}`).once("value")));
  const slots = snapshots.map((snapshot, index) => toOpenSlot(keys[index], snapshot.val()));
  if (slots.some((slot) => !slot)) throw new HttpError(409, "That time was just booked. Please pick another.", ERROR_CODE.SLOT_UNAVAILABLE);

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  if (slots.some((slot) => slot.employeeId !== slots[0].employeeId)) {
    throw new HttpError(400, "Those times are with different professionals.");
  }
  let reachedUntil = slots[0].end.getTime();
  for (let i = 1; i < slots.length; i += 1) {
    if (slots[i].start.getTime() > reachedUntil) throw new HttpError(400, "Those times aren't back to back.");
    reachedUntil = Math.max(reachedUntil, slots[i].end.getTime());
  }
  if (slots[0].start.getTime() <= Date.now()) throw new HttpError(409, "That time has already passed. Please pick another.", ERROR_CODE.SLOT_UNAVAILABLE);
  return slots;
}

/**
 * Takes the slots off the calendar — all of them or none. One transaction on
 * their shared month bucket, so two clients paying for overlapping times
 * can't both win. Returns what was removed (to restore on failure), or null
 * if any slot was gone or booked by then.
 */
async function claimSlots(monthKey, keys) {
  let claimed = null;
  const result = await db.ref(`${FREE_ROOT}/${monthKey}`).transaction((bucket) => {
    // Reset on every attempt: RTDB can rerun this with fresher data.
    claimed = null;
    // Null can mean "not loaded yet" as well as "empty". Committing null (a
    // no-op) makes RTDB retry with the server's value if there is one.
    if (bucket === null) return null;
    if (keys.some((key) => !toOpenSlot(key, bucket[key]))) return undefined;
    const next = Object.assign({}, bucket);
    claimed = {};
    keys.forEach((key) => {
      claimed[key] = bucket[key];
      delete next[key];
    });
    return next;
  });
  return result.committed && claimed ? claimed : null;
}

/** Puts claimed slots back, after a booking that took them failed to write. */
async function restoreSlots(monthKey, claimed) {
  try {
    await db.ref(`${FREE_ROOT}/${monthKey}`).update(claimed);
  } catch (error) {
    logger.error("Could not restore claimed slots", { monthKey, keys: Object.keys(claimed) });
  }
}

/** Who the slots are with, as a name snapshot — kept on the booking in case they're later renamed or removed. */
async function employeeNameFor(employeeId) {
  if (!employeeId) return "";
  try {
    const staff = (await db.ref(`employees/${employeeId}`).once("value")).val();
    return isRecord(staff) ? text(staff.name) : "";
  } catch (error) {
    // Not worth failing a booking over; the id still links it.
    logger.warn("Couldn't read staff record for booking", { employeeId });
    return "";
  }
}

module.exports = { parseSlotPaths, readOpenSlots, claimSlots, restoreSlots, employeeNameFor };
