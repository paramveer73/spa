/**
 * Recurring-slot rules, as agreed in triage.
 *
 * Run with `npm test`. The script pins TZ to America/Los_Angeles (the studio's
 * zone) — the DST case below only means anything in a zone that observes it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  WEEKDAYS,
  effectiveDays,
  generateSlots,
  groupSlotsByWeek,
  nextQuarterHour,
  validateSlotWindow,
} from "./useSlotgenerator.js";

const HOUR = 60 * 60 * 1000;

/** Month is 1-based here so the dates read like a calendar. */
const at = (y, m, d, h = 10, min = 0) => new Date(y, m - 1, d, h, min);

const ymd = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const run = ({ start, end, days = [], weeks = 0 }) =>
  generateSlots({
    selectedDate: start,
    selectedEndDate: end ?? new Date(start.getTime() + HOUR),
    title: "Appointment Available",
    employee: { id: "emp-1" },
    days,
    noOfWeeks: weeks,
  });

const datesOf = (slots) => slots.map((s) => ymd(s.start));

const THU = at(2026, 9, 10); // Thursday 10 Sep 2026, 10:00–11:00
const SAT = at(2026, 9, 12);

/* ------------------------------------------------------------------ *
 * The generation rule
 * ------------------------------------------------------------------ */

test("T1 your example: Thu start, Mon/Tue/Thu/Sat, this week + 5 more", () => {
  const slots = run({ start: THU, days: ["Monday", "Tuesday", "Thursday", "Saturday"], weeks: 5 });
  assert.deepEqual(datesOf(slots), [
    "2026-09-10", "2026-09-12",                             // week 0: Mon/Tue already passed
    "2026-09-14", "2026-09-15", "2026-09-17", "2026-09-19",
    "2026-09-21", "2026-09-22", "2026-09-24", "2026-09-26",
    "2026-09-28", "2026-09-29", "2026-10-01", "2026-10-03",
    "2026-10-05", "2026-10-06", "2026-10-08", "2026-10-10",
    "2026-10-12", "2026-10-13", "2026-10-15", "2026-10-17",
  ]);
});

test("T2 this week only never reaches back before the start", () => {
  const slots = run({ start: THU, days: ["Monday", "Tuesday", "Thursday", "Saturday"], weeks: 0 });
  assert.deepEqual(datesOf(slots), ["2026-09-10", "2026-09-12"]);
});

test("T3 the start weekday is included even when not ticked", () => {
  const slots = run({ start: THU, days: ["Monday", "Saturday"], weeks: 0 });
  assert.deepEqual(datesOf(slots), ["2026-09-10", "2026-09-12"]);
});

test("T3b the auto-included start weekday repeats in later weeks too", () => {
  const slots = run({ start: THU, days: ["Monday", "Saturday"], weeks: 2 });
  assert.deepEqual(datesOf(slots), [
    "2026-09-10", "2026-09-12",
    "2026-09-14", "2026-09-17", "2026-09-19",
    "2026-09-21", "2026-09-24", "2026-09-26",
  ]);
});

test("T4 every day, this week only", () => {
  assert.deepEqual(datesOf(run({ start: THU, days: WEEKDAYS, weeks: 0 })), ["2026-09-10", "2026-09-11", "2026-09-12"]);
});

test("T5 every day, 1 more week — no longer identical to 0 weeks", () => {
  assert.deepEqual(datesOf(run({ start: THU, days: WEEKDAYS, weeks: 1 })), [
    "2026-09-10", "2026-09-11", "2026-09-12",
    "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19",
  ]);
});

test("T6 every day, 5 more weeks", () => {
  const slots = run({ start: THU, days: WEEKDAYS, weeks: 5 });
  assert.equal(slots.length, 33);
  assert.equal(ymd(slots.at(-1).start), "2026-10-17");
});

test("T7 nothing ticked is a weekly repeat of the start day", () => {
  assert.deepEqual(datesOf(run({ start: THU, days: [], weeks: 3 })), [
    "2026-09-10", "2026-09-17", "2026-09-24", "2026-10-01",
  ]);
});

test("T8 a late-week start still produces its own slot", () => {
  assert.deepEqual(datesOf(run({ start: SAT, days: ["Monday"], weeks: 0 })), ["2026-09-12"]);
});

test("T9 ticking the start day does not duplicate it", () => {
  assert.deepEqual(datesOf(run({ start: THU, days: ["Thursday"], weeks: 2 })), [
    "2026-09-10", "2026-09-17", "2026-09-24",
  ]);
});

test("T10 weeks roll over the year boundary", () => {
  assert.deepEqual(datesOf(run({ start: at(2026, 12, 24), days: ["Monday", "Thursday"], weeks: 2 })), [
    "2026-12-24", "2026-12-28", "2026-12-31", "2027-01-04", "2027-01-07",
  ]);
});

test("T11 slots keep wall-clock time across the end of DST (1 Nov)", () => {
  const slots = run({ start: at(2026, 10, 29), days: ["Monday", "Thursday"], weeks: 1 });
  assert.deepEqual(datesOf(slots), ["2026-10-29", "2026-11-02", "2026-11-05"]);
  for (const s of slots) {
    const start = new Date(s.start);
    assert.equal(start.getHours(), 10, `${ymd(start)} drifted to ${start.getHours()}:00`);
    assert.equal(new Date(s.end) - start, HOUR);
  }
});

test("T12 an end time that is not after the start is rejected", () => {
  assert.throws(() => run({ start: THU, end: THU }), /after the start/);
  assert.throws(() => run({ start: THU, end: at(2026, 9, 10, 9) }), /after the start/);
});

test("A1 an end time on a different day is rejected", () => {
  assert.throws(() => run({ start: THU, end: at(2026, 9, 11, 11) }), /same day/);
});

test("a Sunday start is rejected", () => {
  assert.throws(() => run({ start: at(2026, 9, 13) }), /Sunday/);
});

/* ------------------------------------------------------------------ *
 * Invariants — hold for every combination
 * ------------------------------------------------------------------ */

test("invariants: after the start, no Sundays, same time and length, sorted, unique ids", () => {
  const cases = [
    { start: THU, days: ["Monday", "Tuesday", "Thursday", "Saturday"], weeks: 5 },
    { start: THU, days: WEEKDAYS, weeks: 5 },
    { start: at(2026, 12, 24, 14, 30), end: at(2026, 12, 24, 16, 0), days: ["Monday", "Thursday"], weeks: 2 },
    { start: at(2026, 10, 29), days: ["Monday", "Thursday"], weeks: 1 },
  ];
  for (const c of cases) {
    const end = c.end ?? new Date(c.start.getTime() + HOUR);
    const duration = end - c.start;
    const slots = run({ ...c, end });
    const ids = new Set();
    let previous = -Infinity;
    for (const s of slots) {
      const start = new Date(s.start);
      assert.ok(start >= c.start, `${ymd(start)} is before the start`);
      assert.notEqual(start.getDay(), 0, `${ymd(start)} is a Sunday`);
      assert.equal(start.getHours(), c.start.getHours());
      assert.equal(start.getMinutes(), c.start.getMinutes());
      assert.equal(new Date(s.end) - start, duration);
      assert.ok(start.getTime() > previous, "slots are not in date order");
      previous = start.getTime();
      assert.ok(!ids.has(s.id), "duplicate id");
      ids.add(s.id);
      assert.equal(s.title, "Appointment Available");
      assert.equal(s.employeeId, "emp-1");
    }
  }
});

test("exhaustive: every Mon–Sat start × every tick set × {0,1,5} weeks yields slots, first one at the start", () => {
  let combinations = 0;
  for (let day = 7; day <= 12; day++) {                      // Mon 7 … Sat 12 Sep 2026
    const start = at(2026, 9, day);
    for (let mask = 0; mask < 64; mask++) {
      const days = WEEKDAYS.filter((_, i) => mask & (1 << i));
      for (const weeks of [0, 1, 5]) {
        combinations++;
        const slots = run({ start, days, weeks });
        assert.ok(slots.length > 0);
        assert.equal(new Date(slots[0].start).getTime(), start.getTime());
      }
    }
  }
  assert.equal(combinations, 1152);
});

/* ------------------------------------------------------------------ *
 * The auto-ticked start day (T13–T16) — the form renders what this returns
 * ------------------------------------------------------------------ */

test("T13 the start weekday is always in the effective set", () => {
  assert.deepEqual(effectiveDays([], THU), ["Thursday"]);
});

test("T14 moving the start releases the old day if it was never ticked", () => {
  assert.deepEqual(effectiveDays([], at(2026, 9, 11)), ["Friday"]);
});

test("T15 manual ticks survive a start-date change, in Mon→Sat order", () => {
  assert.deepEqual(effectiveDays(["Saturday", "Monday"], at(2026, 9, 11)), ["Monday", "Friday", "Saturday"]);
});

test("T16 a manual tick on the start day is kept once the start moves away", () => {
  const WED = at(2026, 9, 9);
  assert.deepEqual(effectiveDays(["Thursday"], WED), ["Wednesday", "Thursday"]);
  assert.deepEqual(effectiveDays(["Thursday"], THU), ["Thursday"]);
  assert.deepEqual(effectiveDays(["Thursday"], WED), ["Wednesday", "Thursday"]);
});

/* ------------------------------------------------------------------ *
 * Confirm dialog grouping (T19)
 * ------------------------------------------------------------------ */

test("T19 your example groups as this week (2) then five weeks of four", () => {
  const groups = groupSlotsByWeek(run({ start: THU, days: ["Monday", "Tuesday", "Thursday", "Saturday"], weeks: 5 }), THU);
  assert.deepEqual(groups.map((g) => g.week), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(groups.map((g) => g.slots.length), [2, 4, 4, 4, 4, 4]);
});

/* ------------------------------------------------------------------ *
 * Form defaults and validation (A2, T21)
 * ------------------------------------------------------------------ */

test("A2 the default start rounds up to the next quarter hour with no seconds", () => {
  assert.deepEqual(nextQuarterHour(new Date(2026, 8, 10, 12, 10, 37, 500)), at(2026, 9, 10, 12, 15));
  assert.deepEqual(nextQuarterHour(new Date(2026, 8, 10, 12, 15, 0, 0)), at(2026, 9, 10, 12, 15));
  assert.deepEqual(nextQuarterHour(new Date(2026, 8, 10, 12, 45, 1)), at(2026, 9, 10, 13, 0));
});

test("T21 validateSlotWindow explains what is wrong, or returns null", () => {
  assert.equal(validateSlotWindow(THU, new Date(THU.getTime() + HOUR)), null);
  assert.match(validateSlotWindow(THU, THU), /after the start/);
  assert.match(validateSlotWindow(THU, at(2026, 9, 11, 11)), /same day/);
  assert.match(validateSlotWindow(at(2026, 9, 13), at(2026, 9, 13, 11)), /Sunday/);
  assert.match(validateSlotWindow(new Date(NaN), THU), /complete/);
  assert.match(validateSlotWindow(THU, new Date(NaN)), /complete/);
});
