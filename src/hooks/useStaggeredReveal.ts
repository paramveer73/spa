import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const STEP_MS = 120;

export interface RevealStyle {
  opacity: number;
  transform: string;
  transition: string;
}

/**
 * Fires once when the section scrolls into view, then hands back a per-index
 * style so siblings cascade in rather than appearing all at once.
 *
 * Deliberately CSS transitions rather than GSAP: these are simple one-shot
 * entrances, so they still play if ScrollTrigger is disabled for
 * reduced-motion users.
 *
 * Three mechanisms, because content that never reveals is the worst possible
 * failure and IntersectionObserver cannot be fully trusted:
 *
 *   1. A synchronous rect check on mount. Anything already on screen — the
 *      hero, or any section when the user lands on a #hash deep in the page —
 *      reveals immediately instead of waiting for an async callback.
 *   2. The observer, for sections genuinely below the fold.
 *   3. A passive scroll/resize listener as a backstop. Some embedded and
 *      headless contexts construct an IntersectionObserver happily and then
 *      never invoke it, which would otherwise strand every section at
 *      opacity 0 with no error to explain why.
 */
export default function useStaggeredReveal(count: number, threshold = 0.15) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    let done = false;
    let observer: IntersectionObserver | undefined;

    const reveal = () => {
      if (done) return;
      done = true;
      setVisible(true);
      observer?.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };

    /** True once `threshold` of the element (or of the viewport) is showing. */
    function check() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const visiblePx = Math.min(rect.bottom, viewport) - Math.max(rect.top, 0);
      if (visiblePx <= 0) return;

      // Tall sections can never show `threshold` of their own height, so
      // measure against whichever is smaller — the element or the viewport.
      const target = Math.min(rect.height, viewport) * threshold;
      if (visiblePx >= target) reveal();
    }

    check();
    if (done) return undefined;

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) reveal();
      }, { threshold });
      observer.observe(node);
    }

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [threshold]);

  const getAnimStyle = (index: number): RevealStyle => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(24px)",
    transition:
      `opacity .6s ${EASE} ${index * STEP_MS}ms, ` +
      `transform .6s ${EASE} ${index * STEP_MS}ms`,
  });

  return { containerRef, getAnimStyle, visible, count };
}
