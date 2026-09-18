/**
 * Switches for behaviour that's built but can still be turned off.
 *
 * Plain constants for now, so flipping one is a one-line change and a
 * redeploy. Each flag is read in exactly one place, which keeps a later move
 * to remote config (fetched at start-up) confined to this file and that
 * reader.
 */
export interface FeatureFlags {
  /**
   * The booking calendar only offers a start time when the same professional
   * has enough time free in a row — back-to-back slots joined together — for
   * everything in the cart. Off: every open slot is offered, whatever the
   * cart's length.
   */
  CONTINUOUS_TIME_FILTER: boolean;
}

export const FEATURE_FLAGS: Readonly<FeatureFlags> = Object.freeze({
  CONTINUOUS_TIME_FILTER: true,
});
