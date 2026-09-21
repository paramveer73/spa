const { admin } = require("../firebaseAdmin");

/**
 * Requires a signed-in client: verifies the Firebase ID token sent as
 * `Authorization: Bearer <token>` and puts who it is on `req.user`.
 *
 * The uid is the only identity the payment routes trust. It picks the Stripe
 * customer and the `users/{uid}` node, so a client can only ever reach their
 * own cards and orders — nothing in a request body can name someone else's.
 */
async function requireUser(req, res, next) {
  const match = /^Bearer (.+)$/.exec(req.get("authorization") || "");
  if (!match) return res.status(401).json({ error: "Sign in to continue." });

  let token;
  try {
    token = await admin.auth().verifyIdToken(match[1]);
  } catch (error) {
    return res.status(401).json({ error: "Your sign-in has expired. Sign in again to continue." });
  }
  req.user = { uid: token.uid, email: token.email || "", name: token.name || "" };
  return next();
}

module.exports = { requireUser };
