/** Section that acts as the in-house booking entry point. */
export const BOOKING_ANCHOR = "book";

/**
 * Smooth in-page scroll to a section id.
 *
 * Booking used to hand off to an external Vagaro page. It now stays on-site,
 * so every "Book" CTA routes here instead — and once the real booking flow is
 * wired up, this is the single place that has to change.
 */
export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

export const scrollToBooking = () => scrollToSection(BOOKING_ANCHOR);
