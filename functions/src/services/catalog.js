const { db } = require("../firebaseAdmin");
const { ERROR_CODE, HttpError } = require("../utils/httpError");
const { isRecord, text, toNumber, SAFE_KEY } = require("../utils/values");

/**
 * Prices a booking from the `catalog` node — the same data the booking page
 * shows and the admin Services screen edits (shape in src/data/catalog.ts).
 * The client sends service ids only; every price, length and the retainer
 * percentage are read here, so nothing the browser sends can change what's
 * charged.
 */

const MAX_SERVICES = 20;

async function priceServices(serviceIds) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0 || serviceIds.length > MAX_SERVICES) {
    throw new HttpError(400, "Choose at least one service.");
  }
  const ids = Array.from(new Set(serviceIds.map(text)));
  if (ids.some((id) => !SAFE_KEY.test(id))) throw new HttpError(400, "One of those services isn't valid.");

  const [servicesSnap, policiesSnap] = await Promise.all([
    db.ref("catalog/services").once("value"),
    db.ref("catalog/policies").once("value"),
  ]);
  const catalog = servicesSnap.val() || {};

  const services = [];
  ids.forEach((id) => {
    const raw = catalog[id];
    if (!isRecord(raw)) return;
    const name = text(raw.name);
    const price = toNumber(raw.price);
    const duration = toNumber(raw.duration);
    if (name && price !== null && price >= 0 && duration !== null && duration > 0) {
      services.push({ id, name, price, duration });
    }
  });
  if (services.length !== ids.length) {
    throw new HttpError(
      409,
      "Something in your booking is no longer on the menu. Go back to Services and check your picks.",
      ERROR_CODE.MENU_CHANGED,
    );
  }

  const policies = policiesSnap.val();
  const percent = isRecord(policies) ? toNumber(policies.deposit_percent) : null;
  if (percent === null || percent < 0 || percent > 100) {
    throw new HttpError(503, "Online booking is paused while the studio updates its policies. Please call to book.");
  }

  const totalPrice = services.reduce((total, service) => total + service.price, 0);
  const totalDuration = services.reduce((total, service) => total + service.duration, 0);
  return {
    services,
    totalPrice,
    totalDuration,
    retainer: {
      percent,
      // Whole dollars, rounded — the same rule as depositFor on the site, so
      // the amount the client ticked the box for is the amount charged.
      amount: Math.round((totalPrice * percent) / 100),
      refundable: policies.deposit_refundable === true,
    },
  };
}

module.exports = { priceServices };
