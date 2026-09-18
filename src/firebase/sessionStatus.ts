/**
 * Where the auth check is. Firebase restores a saved session asynchronously,
 * so every visit starts CHECKING for a moment before settling on one of the
 * other two. Keyed like BOOKING_STEP, so a typo'd status fails to compile
 * instead of silently never matching.
 */
export const SESSION_STATUS = Object.freeze({
  CHECKING: "checking",
  SIGNED_IN: "signed-in",
  SIGNED_OUT: "signed-out",
} as const);

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
