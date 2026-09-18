import { describeOwner, matchesProfessional } from "@/utils/employees";
import { toDate } from "@/utils/timeframe";

/**
 * Booked appointments, read from `appointments/bookedAppointments/{month}/{key}`.
 *
 * This module is the only place that knows the stored shape. Two shapes exist:
 * current records are flat (`{ name, email, phone, message, start, end,
 * employeeId, eventKey, bookedAppointmentKey }`), and older ones nest the
 * client under `userdata` with each booked service as a sibling key. Both come
 * out as the same `Booking`, so nothing downstream branches on the shape.
 */

const BOOKED_ROOT = "appointments/bookedAppointments";

// A free slot's path is exactly `appointments/freeAppointments/{month}/{key}`.
// Cancelling a booking nulls the `eventKey` it carries, so anything else — an
// empty string, or a parent path like "appointments" — would delete far more
// than one slot. Only a full, well-formed slot path is ever passed on.
const SLOT_PATH = /^appointments\/freeAppointments\/[^/]+\/[^/]+$/;

export interface Booking {
    /** Full database path of the record: unique, and what cancelling deletes. */
    id: string;
    monthKey: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    services: string[];
    start: Date;
    end: Date;
    employeeId: string | null;
    /**
     * Who it was booked with at the time, kept as written. Shown when there's
     * no live staff record to resolve `employeeId` against — former staff, or
     * a legacy record that only ever stored a name.
     */
    employeeName?: string;
    /** Path of the free slot this booking took, when the record kept a valid one. */
    eventKey?: string;
}

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function serviceName(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (isRecord(value)) return text(value.name) || text(value.title);
    return "";
}

function serviceNames(raw: RawRecord, legacy: boolean): string[] {
    const source = legacy
        ? Object.entries(raw)
              .filter(([key]) => key !== "userdata")
              .map(([, value]) => value)
        : [raw.services ?? raw.service].flat();
    return source.map(serviceName).filter(Boolean);
}

function toBooking(monthKey: string, pushKey: string, raw: unknown): Booking | null {
    if (!isRecord(raw)) return null;

    const legacy = isRecord(raw.userdata);
    const person = legacy ? (raw.userdata as RawRecord) : raw;

    // Without a start a record can't be placed in time at all, so it's
    // dropped. A missing end is kept as a zero-length booking instead: the
    // oldest records never stored one, and hiding a real booking is worse
    // than not knowing how long it ran.
    const start = toDate(person.start);
    if (!start) return null;
    const end = toDate(person.end) ?? start;

    const eventKey = text(person.eventKey);
    const employeeId = text(person.employeeId) || text(raw.employeeId);

    return {
        // The path it was read from, not the stored `bookedAppointmentKey`:
        // this is where the record provably lives, and legacy records don't
        // all carry the key.
        id: `${BOOKED_ROOT}/${monthKey}/${pushKey}`,
        monthKey,
        name: text(person.name) || text(person.fullName),
        email: text(person.email),
        phone: text(person.phone) || text(person.number),
        message: text(person.message),
        services: serviceNames(raw, legacy),
        start,
        end,
        employeeId: employeeId || null,
        // `employee` is the legacy name field, so unmigrated records show a name too.
        employeeName: text(person.employeeName) || text(person.employee) || undefined,
        eventKey: SLOT_PATH.test(eventKey) ? eventKey : undefined,
    };
}

/** Every booking in the `bookedAppointments` tree, as a flat list. */
export function normalizeBookings(tree: unknown): Booking[] {
    if (!isRecord(tree)) return [];
    const bookings: Booking[] = [];
    for (const [monthKey, month] of Object.entries(tree)) {
        if (!isRecord(month)) continue;
        for (const [pushKey, raw] of Object.entries(month)) {
            const booking = toBooking(monthKey, pushKey, raw);
            if (booking) bookings.push(booking);
        }
    }
    return bookings;
}

/**
 * Who a booking is with, as the admin should show it: the live staff record
 * when `employeeId` still resolves, otherwise the name it was booked under,
 * otherwise "Unassigned".
 */
export function bookingOwner(employees: { id: string; name: string; color: string }[], booking: Booking) {
    const owner = describeOwner(employees, booking.employeeId);
    if (!owner.missing || !booking.employeeName) return owner;
    return { name: booking.employeeName, color: undefined, missing: true };
}

/**
 * Bookings for one professional (an employee id, ALL_PROFESSIONALS or
 * UNASSIGNED). Applied before the timeframe, so the timeframe counts describe
 * what's left after this choice.
 */
export function bookingsForProfessional(bookings: Booking[], professional: string): Booking[] {
    return bookings.filter((booking) => matchesProfessional(booking.employeeId, professional));
}

/**
 * The paths `firebase.deleteBookedAppointment` nulls to cancel a booking.
 *
 * It always nulls both keys. With no slot path on record, the booking's own
 * path is passed twice rather than leaving `eventKey` undefined — an undefined
 * key would become a write to a root node literally named "undefined".
 */
export function cancellationKeys(booking: Booking) {
    return {
        bookedAppointmentKey: booking.id,
        eventKey: booking.eventKey ?? booking.id,
    };
}
