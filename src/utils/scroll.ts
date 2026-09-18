/**
 * Id of the booking block in the contact section. Booking itself is a page now
 * (ROUTES.BOOK) — this only keeps `/#book` deep links landing somewhere sane.
 */
export const BOOKING_ANCHOR = "book";

/** Smooth in-page scroll to a section id — the navbar's section links. */
export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}
