import type { Slot } from "./types";

/**
 * Which slots can start an appointment of a given length.
 *
 * Studios publish time as short back-to-back slots (10:00–10:30, 10:30–11:00…),
 * so a 90-minute appointment rarely fits inside one slot — it fits across
 * several. A slot qualifies when the continuous run of time it starts, with
 * the same professional, lasts at least as long as the appointment.
 *
 * Start times stay on slot boundaries. Offering every quarter hour inside a
 * run would give more choice, but a booking could then begin halfway through
 * a slot, and nothing that claims slots can split one.
 */

const MS_PER_MINUTE = 60_000;

interface Run {
  slots: Slot[];
  /** Epoch ms at which the run's continuous time ends. */
  end: number;
}

const ownerOf = (slot: Slot): string | null =>
  typeof slot.employeeId === "string" && slot.employeeId ? slot.employeeId : null;

const byStart = (a: Slot, b: Slot) => a.start.getTime() - b.start.getTime();

/**
 * Groups slots into runs of unbroken time, one professional at a time. A
 * slot that starts at or before the current run's end continues it, so
 * overlapping slots join as well as touching ones.
 */
function continuousRuns(slots: Slot[]): Run[] {
  const runs: Run[] = [];
  const byOwner = new Map<string, Slot[]>();

  for (const slot of slots) {
    const owner = ownerOf(slot);
    // With no professional on record there's no telling whose time follows
    // it, so an unassigned slot only ever stands alone.
    if (!owner) {
      runs.push({ slots: [slot], end: slot.end.getTime() });
      continue;
    }
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), slot]);
  }

  for (const owned of byOwner.values()) {
    let current: Run | null = null;
    for (const slot of [...owned].sort(byStart)) {
      if (current && slot.start.getTime() <= current.end) {
        current.slots.push(slot);
        current.end = Math.max(current.end, slot.end.getTime());
      } else {
        current = { slots: [slot], end: slot.end.getTime() };
        runs.push(current);
      }
    }
  }
  return runs;
}

/**
 * The slots an appointment of `requiredMinutes` could start in, each returned
 * with `appointmentEnd` (when it would finish) and `eventKeys` (every slot it
 * would take, so a booking can claim them together).
 *
 * Expects open slots only: a booked slot left in would bridge a gap that
 * isn't free. A missing or non-positive length returns the slots unchanged —
 * the filter is off.
 */
export function slotsWithContinuousTime(slots: Slot[], requiredMinutes?: number): Slot[] {
  if (!requiredMinutes || requiredMinutes <= 0) return slots;
  const requiredMs = requiredMinutes * MS_PER_MINUTE;

  const fitting: Slot[] = [];
  for (const run of continuousRuns(slots)) {
    for (const slot of run.slots) {
      const start = slot.start.getTime();
      const appointmentEnd = start + requiredMs;
      if (appointmentEnd > run.end) continue;

      const covered = run.slots.filter(
        (other) => other.start.getTime() < appointmentEnd && other.end.getTime() > start,
      );
      fitting.push({
        ...slot,
        appointmentEnd: new Date(appointmentEnd),
        eventKeys: covered.map((other) => other.eventKey).filter((key): key is string => Boolean(key)),
      });
    }
  }
  return fitting;
}
