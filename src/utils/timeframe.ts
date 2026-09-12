/**
 * Where an appointment sits relative to "now" — what the admin tables filter
 * on and what their status chips show.
 *
 * `now` is always passed in rather than read inside, so a table can hold one
 * clock for every row and re-render on a timer, and every row is classified
 * against the same instant.
 */

/** A single row's status. */
export type TimeStatus = "today" | "upcoming" | "past";

/** What the timeframe filter can be set to. "upcoming" includes today. */
export type TimeframeFilter = "upcoming" | "today" | "past" | "all";

export const TIMEFRAME_LABELS: Record<TimeframeFilter, string> = {
  upcoming: "Upcoming",
  today: "Today",
  past: "Past",
  all: "All",
};

export const TIME_STATUS_LABELS: Record<TimeStatus, string> = {
  today: "Today",
  upcoming: "Upcoming",
  past: "Past",
};

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Past once it has *ended*, so an appointment in progress still counts as
 * today — staff looking at the day's list still need to see who's in the chair.
 */
export function timeStatus(start: Date, end: Date, now: Date): TimeStatus {
  if (end.getTime() <= now.getTime()) return "past";
  return isSameDay(start, now) ? "today" : "upcoming";
}

export function matchesTimeframe(status: TimeStatus, filter: TimeframeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "upcoming") return status !== "past";
  return status === filter;
}

export function filterByTimeframe<T extends { start: Date; end: Date }>(
  rows: T[],
  filter: TimeframeFilter,
  now: Date,
): T[] {
  if (filter === "all") return rows;
  return rows.filter((row) => matchesTimeframe(timeStatus(row.start, row.end, now), filter));
}

/** How many rows each filter option would show — the numbers on the toggle. */
export function countByTimeframe<T extends { start: Date; end: Date }>(
  rows: T[],
  now: Date,
): Record<TimeframeFilter, number> {
  const counts: Record<TimeframeFilter, number> = { upcoming: 0, today: 0, past: 0, all: rows.length };
  for (const row of rows) {
    const status = timeStatus(row.start, row.end, now);
    if (status === "past") counts.past += 1;
    else {
      counts.upcoming += 1;
      if (status === "today") counts.today += 1;
    }
  }
  return counts;
}

/** Whole minutes between two instants. */
export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

/** A value from Firebase as a Date, or null when it can't be one. */
export function toDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
