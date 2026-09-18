import { endOfDay, startOfDay } from "date-fns";
import { matchesProfessional } from "@/utils/employees";
import { minutesBetween, toDate } from "@/utils/timeframe";

/**
 * Open (bookable) slots, read from `appointments/freeAppointments/{month}/{key}`.
 * The same tree the booking calendar reads, flattened into table rows.
 */

const FREE_ROOT = "appointments/freeAppointments";

export interface OpenSlot {
    /** Full database path: unique, and what `deleteEventsForSure` nulls. */
    id: string;
    eventKey: string;
    monthKey: string;
    start: Date;
    end: Date;
    durationMinutes: number;
    employeeId: string | null;
    /**
     * True for a slot a booking marked in place (`extra.status`) instead of
     * removing. Not open any more, but still the studio's time — the schedule
     * calendar shows it, the open-slot views filter it out.
     */
    booked: boolean;
    /** Whatever the slot was published as, for the calendar's event label. */
    title?: string;
}

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

function toOpenSlot(monthKey: string, pushKey: string, raw: unknown): OpenSlot | null {
    if (!isRecord(raw)) return null;

    const extra = isRecord(raw.extra) ? raw.extra : {};
    const start = toDate(raw.start);
    const end = toDate(raw.end);
    if (!start || !end) return null;

    // The path it was read from rather than the stored `eventKey`, so a delete
    // always targets the record that's actually there.
    const path = `${FREE_ROOT}/${monthKey}/${pushKey}`;
    const employeeId = typeof raw.employeeId === "string" && raw.employeeId ? raw.employeeId : null;

    return {
        id: path,
        eventKey: path,
        monthKey,
        start,
        end,
        durationMinutes: minutesBetween(start, end),
        employeeId,
        booked: Boolean(extra.status),
        title: typeof raw.title === "string" ? raw.title : undefined,
    };
}

/** Every slot in the `freeAppointments` tree — booked-in-place ones included. */
export function normalizeFreeSlots(tree: unknown): OpenSlot[] {
    if (!isRecord(tree)) return [];
    const slots: OpenSlot[] = [];
    for (const [monthKey, month] of Object.entries(tree)) {
        if (!isRecord(month)) continue;
        for (const [pushKey, raw] of Object.entries(month)) {
            const slot = toOpenSlot(monthKey, pushKey, raw);
            if (slot) slots.push(slot);
        }
    }
    return slots;
}

/** Only what a client could still book. */
export function openOnly(slots: OpenSlot[]): OpenSlot[] {
    return slots.filter((slot) => !slot.booked);
}

/**
 * Slots for one professional (an employee id, ALL_PROFESSIONALS or
 * UNASSIGNED) whose start falls within [from, to] as whole calendar days;
 * null leaves that side open. Applied before the timeframe, so the timeframe
 * counts describe what's left after these choices.
 */
export function scopeFreeSlots(
    slots: OpenSlot[],
    professional: string,
    from: Date | null,
    to: Date | null,
): OpenSlot[] {
    const earliest = from ? startOfDay(from).getTime() : -Infinity;
    const latest = to ? endOfDay(to).getTime() : Infinity;
    return slots.filter((slot) => {
        const start = slot.start.getTime();
        return start >= earliest && start <= latest && matchesProfessional(slot.employeeId, professional);
    });
}
