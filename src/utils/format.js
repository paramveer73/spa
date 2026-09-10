/**
 * Small formatting helpers shared by the booking flow.
 */

export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours} hr${hours > 1 ? "s" : ""} ${remainder} min`;
}

export function parsePrice(price) {
  if (typeof price !== "number") {
    const numeric = parseFloat(String(price).replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return price;
}

export function formatPrice(amount) {
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function sumAppointments(appointments) {
  return appointments.reduce((total, item) => total + parsePrice(item.price), 0);
}

export function sumDuration(appointments) {
  return appointments.reduce((total, item) => total + (item.durationMinutes || 0), 0);
}

export function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTime(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}
