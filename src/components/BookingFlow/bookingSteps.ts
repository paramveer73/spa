/**
 * The booking wizard's steps, string-keyed rather than raw indices: a stray
 * reorder or a typo'd literal then fails loudly instead of silently rendering
 * the wrong step. BOOKING_STEP_ORDER is the only place the ordering lives —
 * MUI's <Stepper activeStep> wants a number, so that mapping happens once.
 *
 * Same shape as the orchid11 build's constants/bookingSteps, so the two flows
 * stay legible side by side.
 */
export const BOOKING_STEP = Object.freeze({
  SERVICES: "services",
  CALENDAR: "calendar",
  CONFIRMATION: "confirmation",
} as const);

export type BookingStep = (typeof BOOKING_STEP)[keyof typeof BOOKING_STEP];

export const BOOKING_STEP_ORDER: BookingStep[] = [
  BOOKING_STEP.SERVICES,
  BOOKING_STEP.CALENDAR,
  BOOKING_STEP.CONFIRMATION,
];

export const BOOKING_STEP_LABELS: Record<BookingStep, string> = {
  [BOOKING_STEP.SERVICES]: "Services",
  [BOOKING_STEP.CALENDAR]: "Time",
  [BOOKING_STEP.CONFIRMATION]: "Confirm",
};

/** The step after this one, or the same step at the end of the flow. */
export function nextStep(step: BookingStep): BookingStep {
  const index = BOOKING_STEP_ORDER.indexOf(step);
  return BOOKING_STEP_ORDER[index + 1] ?? step;
}

/** The step before this one, or the same step at the start. */
export function previousStep(step: BookingStep): BookingStep {
  const index = BOOKING_STEP_ORDER.indexOf(step);
  return BOOKING_STEP_ORDER[index - 1] ?? step;
}
