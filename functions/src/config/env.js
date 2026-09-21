/**
 * Central place for every environment-derived value the app reads from
 * functions/.env (see functions/.env.example). Nothing here has a default
 * that silently succeeds without real credentials — each consumer decides
 * how to fail when its own config is missing (see services/emailService.js,
 * services/instagramService.js).
 */

// The Gmail account confirmations are sent from. Read from the environment
// rather than written here, so a copied .env can't quietly send one
// business's mail from another's account — unset, sending fails loudly.
const GMAIL_USER = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : undefined;
// Google displays App Passwords as 4 space-separated groups of 4 — strip any
// whitespace in case it was pasted verbatim (including a trailing newline,
// which `firebase functions:secrets:set` picks up if the value was piped in
// via `echo` instead of `echo -n`).
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
  ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, "")
  : undefined;

// Internal copy of every confirmation. Defaults to the sending mailbox so
// the function still works (just without a separate notify address) if this
// isn't set.
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL && process.env.NOTIFY_EMAIL.trim()) || GMAIL_USER;

// Instagram Graph API — see src/services/instagramService.js for how these
// are used, and functions/.env.example for how to generate them.
const IG_USER_ID = process.env.IG_USER_ID;
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN
  ? process.env.IG_ACCESS_TOKEN.trim()
  : undefined;

// Stripe — cards on file and the booking retainer (src/services/stripe.js,
// src/routes/cardsRouter.js, src/routes/checkoutRouter.js). Test keys
// (sk_test_…) locally, live keys in production; both are secrets, declared in
// index.js. Trimmed for the same pasted-newline reason as the app password.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  ? process.env.STRIPE_SECRET_KEY.trim()
  : undefined;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
  ? process.env.STRIPE_WEBHOOK_SECRET.trim()
  : undefined;

// Catalog prices are US dollars.
const CURRENCY = "usd";

module.exports = {
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  NOTIFY_EMAIL,
  IG_USER_ID,
  IG_ACCESS_TOKEN,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CURRENCY,
};
