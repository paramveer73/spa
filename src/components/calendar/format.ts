/**
 * Tiny date-formatting helpers, duplicated (not imported) from the host
 * app's utils/format.js on purpose — keeping this library's only outside
 * dependencies as plain npm packages (react, @mui/*) rather than reaching
 * back into the host app's own src tree is what makes it copy-paste-able.
 */

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTime(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
