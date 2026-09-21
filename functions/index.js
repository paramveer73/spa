/*
Cloud Functions for KTLN Studio.

Receives a booking request from the website, records it in Realtime
Database, and emails a confirmation to the client (and the studio). Also
serves the Instagram feed (src/routes/instagramRouter.js).

Stripe: cards on file (src/routes/cardsRouter.js — card operations only) and
booking with a retainer (src/routes/checkoutRouter.js). Clients are Stripe
customers keyed by their Firebase uid; their orders live at
users/{uid}/orders. Both routers need a signed-in client (Firebase ID token).

Email auth: Gmail App Password (see .env.example) instead of OAuth2.
OAuth2 refresh tokens for "less common" Google scopes get silently revoked
after ~6 months, or sooner if the account goes quiet — which is exactly
what happens during a slow week with no bookings. An App Password tied to
a 2FA-enabled account does not expire on its own.

This file is intentionally just wiring — one concern per file under src/:
  src/config/     env var reads, filesystem paths
  src/constants/  business info, static template/attachment data
  src/utils/      pure helper functions (date/price formatting, HttpError)
  src/middleware/ requireUser — Firebase ID token → req.user
  src/services/   external integrations (email, Instagram, Stripe) and the
                   booking logic — slots, pricing, orders
  src/routes/     Express routers, one per feature, thin controllers over
                   the services
  src/firebaseAdmin.js  Admin SDK init (imported once, here, for its
                         initializeApp() side effect)
*/

const express = require("express");
const cors = require("cors");
const functions = require("firebase-functions/v1");
const logger = require("firebase-functions/logger");

require("./src/firebaseAdmin");

const appointmentsRouter = require("./src/routes/appointmentsRouter");
const instagramRouter = require("./src/routes/instagramRouter");
const cardsRouter = require("./src/routes/cardsRouter");
const checkoutRouter = require("./src/routes/checkoutRouter");
const { HttpError } = require("./src/utils/httpError");

const app = express();
// Any origin: the card and checkout routes authenticate with a bearer token,
// not cookies, so a foreign page can't borrow a client's session.
app.use(cors({ origin: true }));
app.use(appointmentsRouter);
app.use(instagramRouter);
app.use(cardsRouter);
app.use(checkoutRouter);

// Errors thrown by the card and checkout routes land here (Express 5 forwards
// rejected async handlers). An HttpError's message was written for the
// client; anything else is logged and answered generically, so Stripe or
// database internals never reach the page. Four parameters is how Express
// recognises an error handler, so `next` stays although it's unused.
app.use((error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json(error.code ? { error: error.message, code: error.code } : { error: error.message });
  }
  logger.error("Request failed", { path: req.path, type: error && error.type, message: error && error.message });
  return res.status(500).json({ error: "Something went wrong on our side. Please try again." });
});

// Expose the Express API as a single Cloud Function.
//
// runWith({ secrets: [...] }) is required for GMAIL_APP_PASSWORD to actually
// reach process.env at runtime. Storing a value in Secret Manager (e.g. via
// `firebase functions:secrets:set GMAIL_APP_PASSWORD`) does NOT expose it to
// a function automatically — a function only gets read access to (and has
// it injected as an env var from) secrets it explicitly declares here. Without
// this, GMAIL_APP_PASSWORD stays undefined in the deployed function even
// though the secret exists, and every booking's confirmation email fails
// (see src/services/emailService.js's getTransport()).
//
// The Stripe keys are declared the same way, so each must exist in Secret
// Manager before a deploy (see .env.example for the commands).
exports.widgets = functions
  .runWith({ secrets: ["GMAIL_APP_PASSWORD", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] })
  .https.onRequest(app);
