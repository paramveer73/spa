/** Small guards for reading request bodies and database records, which are both untrusted shapes. */

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A number, or a numeric string typed into the console; anything else is null. */
function toNumber(value) {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

// The characters a Realtime Database key can't contain. Ids from requests
// become path segments, so anything else could reach a different node.
const SAFE_KEY = /^[^/.#$[\]]+$/;

module.exports = { text, isRecord, toNumber, SAFE_KEY };
