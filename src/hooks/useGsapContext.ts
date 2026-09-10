import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Runs `build` inside a gsap.context() scoped to `scope`, so every tween and
 * ScrollTrigger created in it is reverted together on unmount. Without the
 * context, ScrollTriggers survive hot-reloads and pile up, and each one keeps
 * firing against detached DOM nodes.
 *
 * useLayoutEffect, not useEffect: a `.from()` tween writes its start state when
 * the timeline is built, and useEffect does not run until after the browser has
 * painted. That leaves exactly one frame showing the element at its *finished*
 * position before it snaps back to animate — a visible flash on the navbar and
 * hero as the splash clears. Layout effects run before paint, so the start
 * state is already in place on the first painted frame.
 *
 * Skipped entirely when the user has asked for reduced motion — the content is
 * already in its resting state, so doing nothing is the correct fallback.
 */
export default function useGsapContext(
  scope: RefObject<HTMLElement | null>,
  build: (ctx: gsap.Context) => void,
  deps: unknown[] = []
) {
  const buildRef = useRef(build);
  buildRef.current = build;

  useLayoutEffect(() => {
    if (!scope.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const ctx = gsap.context((self) => buildRef.current(self), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export { gsap, ScrollTrigger };
