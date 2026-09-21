const express = require("express");

const { requireUser } = require("../middleware/requireUser");
const { stripe, customerIdFor, ownedCard, defaultCardId, toCard } = require("../services/stripe");
const { HttpError } = require("../utils/httpError");
const { isRecord, text, toNumber } = require("../utils/values");

/**
 * Cards on file — list, add, update, remove — and nothing else. Every card
 * lives on Stripe under the client's customer (keyed by Firebase uid); the
 * card number never reaches this server or the database. Adding happens in
 * the browser: this hands out a SetupIntent, and Stripe.js collects the card
 * straight to Stripe against it.
 *
 *   GET    /cards               the client's cards, default flagged
 *   POST   /cards/setup-intent  a client secret for adding one
 *   PATCH  /cards/:id           { makeDefault: true } and/or { expMonth, expYear }
 *   DELETE /cards/:id           detach it
 */
const router = express.Router();

router.use("/cards", requireUser);

const MAX_CARDS = 20;

/** Expiry from a request, or null when none was sent. Throws on a half-sent or impossible date. */
function toExpiry(rawMonth, rawYear) {
  if (rawMonth === undefined && rawYear === undefined) return null;
  const month = toNumber(rawMonth);
  const year = toNumber(rawYear);
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < thisYear || year > thisYear + 20) {
    throw new HttpError(400, "Enter a real expiry month and year.");
  }
  return { month, year };
}

async function cardFor(req) {
  const customerId = await customerIdFor(req.user);
  const method = await ownedCard(customerId, text(req.params.id));
  if (!method) throw new HttpError(404, "That card isn't on your account.");
  return { customerId, method };
}

router.get("/cards", async (req, res) => {
  const customerId = await customerIdFor(req.user);
  const [customer, methods] = await Promise.all([
    stripe().customers.retrieve(customerId),
    stripe().customers.listPaymentMethods(customerId, { type: "card", limit: MAX_CARDS }),
  ]);
  const defaultId = defaultCardId(customer);
  res.json({ cards: methods.data.map((method) => toCard(method, defaultId)) });
});

router.post("/cards/setup-intent", async (req, res) => {
  const customerId = await customerIdFor(req.user);
  // `off_session`: the card is saved to secure bookings, so it has to stay
  // chargeable later — a no-show fee — without the client present.
  const intent = await stripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
    metadata: { firebaseUid: req.user.uid },
  });
  res.json({ clientSecret: intent.client_secret });
});

router.patch("/cards/:id", async (req, res) => {
  const body = isRecord(req.body) ? req.body : {};
  const expiry = toExpiry(body.expMonth, body.expYear);
  const makeDefault = body.makeDefault === true;
  if (!expiry && !makeDefault) throw new HttpError(400, "Nothing to change.");

  const { customerId, method } = await cardFor(req);
  let updated = method;
  if (expiry) {
    updated = await stripe().paymentMethods.update(method.id, { card: { exp_month: expiry.month, exp_year: expiry.year } });
  }
  if (makeDefault) {
    await stripe().customers.update(customerId, { invoice_settings: { default_payment_method: method.id } });
  }
  const customer = await stripe().customers.retrieve(customerId);
  res.json({ card: toCard(updated, defaultCardId(customer)) });
});

router.delete("/cards/:id", async (req, res) => {
  const { method } = await cardFor(req);
  await stripe().paymentMethods.detach(method.id);
  res.status(204).end();
});

module.exports = router;
