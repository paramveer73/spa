export { default as Calendar } from "./Calendar";
export type { CalendarProps } from "./Calendar";

export {
  default as useBookingAvailability,
  DAYS_PER_PAGE,
  groupSlotsByPeriod,
  isSameDay,
  normalizeDate,
  addDays,
  monthsAhead,
} from "./useBookingAvailability";

export { slotsWithContinuousTime } from "./continuousTime";

export { default as useEmployees } from './useEmployees'

export type {
  Employee,
  Slot,
  SlotExtra,
  SlotGroup,
  RawSlot,
  FreeAppointmentsSnapshot,
  BookingDataSource,
  UseBookingAvailabilityArgs,
} from "./types";
