// Mirrors src/utils/format.js on the frontend — kept separate since this
// function has no build step / shared module access to the React app.

const { STUDIO_TIME_ZONE } = require("../constants/business");

function formatDate(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: STUDIO_TIME_ZONE,
  }).format(date);
}

function formatTime(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: STUDIO_TIME_ZONE,
  }).format(date);
}

function parsePrice(price) {
  if (typeof price === "number") return price;
  const numeric = parseFloat(String(price).replace(/[^0-9.]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function formatPrice(amount) {
  return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

function formatDuration(totalMinutes) {
  if (!totalMinutes) return "";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  if (remainder === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours} hr${hours > 1 ? "s" : ""} ${remainder} min`;
}

module.exports = { formatDate, formatTime, parsePrice, formatPrice, formatDuration };
