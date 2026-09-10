/**
 * Shared types for the standalone booking-calendar library. This folder has
 * no dependency on any specific app's data shape — a host app supplies
 * `Employee[]`, a `FirebaseLike` data source, and an `onSlotClicked`
 * callback; everything else is self-contained.
 */

export interface Employee {
  id: string;
  name: string;
  color: string;
}

/** Free-form metadata carried on a slot — `employeeColor` and `status` are
 * the only two fields this library actually reads. */
export interface SlotExtra {
  employeeColor?: string;
  /** Truthy once a slot has been booked — booked slots are filtered out. */
  status?: boolean | string;
  [key: string]: unknown;
}

/** A single bookable (or booked) appointment slot. */
export interface Slot {
  start: Date;
  end: Date;
  extra?: SlotExtra;
  eventKey?: string;
  /** Resolved by the hook from `extra.employeeColor` — not present on the
   * raw data coming out of the data source. */
  employeeName?: string;
  employeeColor?: string;
  [key: string]: unknown;
}

export interface SlotGroup {
  key: string;
  label: string;
  slots: Slot[];
}

/** Whatever a Firebase Realtime Database `onValue` callback receives —
 * typed minimally as the one shape this library actually touches. */
export interface FreeAppointmentsSnapshot {
  val: () => Record<string, Record<string, RawSlot>> | null;
}

/** The raw, unparsed shape of a slot as it comes out of the data source
 * (start/end as ISO strings rather than Date objects). */
export interface RawSlot {
  start: string;
  end: string;
  extra?: SlotExtra;
  eventKey?: string;
  [key: string]: unknown;
}

/**
 * The only interface this library needs from a backend. Doesn't have to be
 * the real Firebase SDK — anything implementing this one method works,
 * which is what lets this folder be copy-pasted into another project and
 * wired up to a different backend (a REST API, a mock, etc.) with zero
 * changes inside the library itself.
 */
export interface BookingDataSource {
  subscribeToFreeAppointments(
    year: number,
    month: number,
    monthFetchingOffset: number,
    callback: (snapshot: FreeAppointmentsSnapshot) => void,
  ): () => void;
}

export interface UseBookingAvailabilityArgs {
  firebase: BookingDataSource;
  employees: Employee[];
  /** Called with the raw slot the user clicked, once it's confirmed still
   * open. No assumption that a multi-step wizard exists on the other end. */
  onSlotClicked: (slot: Slot) => void;
}
