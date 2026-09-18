/**
 * Where a sign-in attempt is. The screen shows one panel per phase, so these
 * are compared all over ClientLogin — keyed, like BOOKING_STEP, so a typo'd
 * phase fails to compile instead of rendering nothing.
 */
export const SIGN_IN_PHASE = Object.freeze({
  /** Choosing: Google, or an email for a link. */
  IDLE: "idle",
  GOOGLE: "google",
  SENDING: "sending",
  /** The link is in their inbox; this page waits. */
  LINK_SENT: "link-sent",
  /** Arrived from the link and finishing sign-in. */
  COMPLETING: "completing",
  /** Arrived from the link in a browser that didn't ask for it, so the address has to be typed. */
  NEEDS_EMAIL: "needs-email",
} as const);

export type SignInPhase = (typeof SIGN_IN_PHASE)[keyof typeof SIGN_IN_PHASE];
