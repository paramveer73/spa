/**
 * An error whose message is safe to show the client, with the status to send.
 * Anything else that's thrown is logged and answered with a generic 500 — see
 * the error handler in index.js — so internal details never reach the page.
 */
class HttpError extends Error {
  /** `code` is optional and machine-readable, for replies the page acts on (see ERROR_CODE). */
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Codes the booking page branches on — e.g. SLOT_UNAVAILABLE offers "pick another time".
const ERROR_CODE = Object.freeze({
  SLOT_UNAVAILABLE: "slot_unavailable",
  PRICE_CHANGED: "price_changed",
  MENU_CHANGED: "menu_changed",
});

module.exports = { HttpError, ERROR_CODE };
