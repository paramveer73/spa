import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export interface MaskPosition {
  /** Card's offset from the section's top-left, in px. */
  x: number;
  y: number;
  /** The section's own size — the "canvas" every card windows into. */
  sw: number;
  sh: number;
}

/**
 * Measures where each card sits inside its section so the cards can share one
 * background image: every card paints the *same* photo, offset by its own
 * position, which makes a grid of separate elements read as one continuous
 * image seen through several windows.
 *
 * Measured rather than computed because the cards are laid out by flex/grid —
 * only the browser knows where they land. A ResizeObserver on the section
 * catches layout changes (viewport resize, font load, mobile URL bar) without
 * polling.
 */

/**
 * Offset of `node` within `ancestor`, walking the offsetParent chain.
 *
 * Deliberately not getBoundingClientRect: the hero tilts its card stack in 3D,
 * and rects report the *visually transformed* box. Feeding those into the mask
 * maths would make the shared photograph slide and skew out of alignment the
 * moment the stack moved. offsetLeft/offsetTop report untransformed layout
 * position, so the mosaic stays locked together however the stage is rotated.
 */
function documentOffset(node: HTMLElement) {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = node;

  while (current) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

function offsetWithin(node: HTMLElement, ancestor: HTMLElement) {
  // Both offsets are resolved all the way to the document and then
  // subtracted, rather than walking up from the card until the section is
  // reached.
  //
  // offsetParent only stops at *positioned* elements, so a section left at
  // `position: static` is skipped entirely — the walk jumped straight to
  // <body> and returned document-relative numbers, which pushed the shared
  // photograph completely outside every card and left them blank. The hero
  // survived that only by accident: its `perspective` makes it a containing
  // block, so it happened to be an offsetParent. Differencing two absolute
  // offsets is correct no matter which ancestors are positioned.
  const target = documentOffset(node);
  const origin = documentOffset(ancestor);
  return { x: target.x - origin.x, y: target.y - origin.y };
}

export default function useMaskPositions(
  sectionRef: RefObject<HTMLElement | null>,
  cardsRef: RefObject<(HTMLElement | null)[]>,
  count: number
) {
  const [positions, setPositions] = useState<MaskPosition[]>([]);
  const frame = useRef(0);

  const measure = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Layout size, not visual size: offsetWidth/Height ignore transforms the
    // way the offset walk below does, so the two always agree.
    const sw = section.offsetWidth;
    const sh = section.offsetHeight;
    const next: MaskPosition[] = [];

    for (let i = 0; i < count; i += 1) {
      const card = cardsRef.current?.[i];
      next.push(card ? { ...offsetWithin(card, section), sw, sh } : { x: 0, y: 0, sw, sh });
    }
    setPositions(next);
  }, [sectionRef, cardsRef, count]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    // Coalesce bursts of resize callbacks into one measurement per frame —
    // ResizeObserver can fire several times during a single drag-resize.
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame.current);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [measure, sectionRef]);

  return positions;
}
