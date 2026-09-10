import { useEffect, useRef, type RefObject } from "react";

export interface ParallaxOptions {
  /** Peak rotation in degrees at the far edge of the container. */
  maxTilt?: number;
  /** How quickly the tilt chases the cursor (0-1, higher = snappier). */
  ease?: number;
}

/**
 * Tilts `target` in 3D toward the pointer, so the hero's card stack reads as
 * physical geometry rather than a flat image.
 *
 * The tilt is eased toward its goal inside a rAF loop rather than written
 * straight from the pointermove handler: pointer events fire far more often
 * than frames, and assigning a transform per event both wastes work and makes
 * the motion feel twitchy. Interpolating gives it weight.
 *
 * No-ops for coarse pointers (there is no hover on touch, and the tilt would
 * never update) and whenever reduced motion is requested.
 */
export default function usePointerParallax(
  target: RefObject<HTMLElement | null>,
  { maxTilt = 6, ease = 0.08 }: ParallaxOptions = {}
) {
  const frame = useRef(0);

  useEffect(() => {
    const node = target.current;
    if (!node) return undefined;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) return undefined;

    const goal = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      // -1..1 from centre, so the sign gives the tilt direction directly.
      goal.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      goal.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const onLeave = () => {
      goal.x = 0;
      goal.y = 0;
    };

    const tick = () => {
      current.x += (goal.x - current.x) * ease;
      current.y += (goal.y - current.y) * ease;
      node.style.transform =
        `rotateY(${current.x * maxTilt}deg) rotateX(${-current.y * maxTilt}deg)`;
      frame.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      node.style.transform = "";
    };
  }, [target, maxTilt, ease]);
}
