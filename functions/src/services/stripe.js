const Stripe = require("stripe");

const { STRIPE_SECRET_KEY } = require("../config/env");
const { HttpError } = require("../utils/httpError");

/**
 * Stripe, and the one mapping this app needs from it: Firebase uid → Stripe
 * customer. The mapping lives on Stripe (the customer's `firebaseUid`
 * metadata), not in the database — the database only ever stores
 * appointment data, and card details never touch it at all.
 */

let client = null;

// Created on first use, so a missing key fails only the requests that need
// Stripe (with a clear 503) rather than every route in the function.
function stripe() {
  if (!client) {
    if (!STRIPE_SECRET_KEY) throw new HttpError(503, "Card payments aren't set up yet. Please call the studio to book.");
    client = new Stripe(STRIPE_SECRET_KEY);
  }
  return client;
}

// uid → customer id for this warm instance, so only a cold start pays for the search.
const customerIds = new Map();

/**
 * The Stripe customer for a signed-in client, created the first time they
 * need one.
 *
 * Found by searching metadata, which can lag a brand-new customer by up to a
 * minute. The idempotency key covers that gap: a second create within 24h
 * returns the first customer instead of making a twin, and by then search has
 * long caught up. Email only — not the display name, which can change, and a
 * reused idempotency key must be sent with identical parameters.
 */
async function customerIdFor(user) {
  const cached = customerIds.get(user.uid);
  if (cached) return cached;

  const query = `metadata['firebaseUid']:'${user.uid.replace(/'/g, "\\'")}'`;
  const found = await stripe().customers.search({ query, limit: 1 });
  let customer = found.data[0];
  if (!customer) {
    const params = { metadata: { firebaseUid: user.uid } };
    if (user.email) params.email = user.email;
    customer = await stripe().customers.create(params, { idempotencyKey: `customer-${user.uid}` });
  }
  customerIds.set(user.uid, customer.id);
  return customer.id;
}

const PAYMENT_METHOD_ID = /^pm_[A-Za-z0-9]+$/;

/**
 * The card, if it's attached to this customer. Every card operation goes
 * through this, so a client can't read, change, remove or pay with a card by
 * guessing another customer's id — to them it simply doesn't exist.
 */
async function ownedCard(customerId, paymentMethodId) {
  if (!PAYMENT_METHOD_ID.test(paymentMethodId)) return null;
  let method;
  try {
    method = await stripe().paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    if (error && error.type === "StripeInvalidRequestError") return null;
    throw error;
  }
  return method.type === "card" && method.customer === customerId ? method : null;
}

/** The customer's default card id, however Stripe returns it (id or expanded object). */
function defaultCardId(customer) {
  if (!customer || customer.deleted || !customer.invoice_settings) return null;
  const value = customer.invoice_settings.default_payment_method;
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** What the site shows of a card — brand, last four, expiry. Never more. */
function toCard(method, defaultId) {
  const card = method.card || {};
  return {
    id: method.id,
    brand: card.brand || "card",
    last4: card.last4 || "",
    expMonth: card.exp_month || null,
    expYear: card.exp_year || null,
    isDefault: method.id === defaultId,
  };
}

module.exports = { stripe, customerIdFor, ownedCard, defaultCardId, toCard };
