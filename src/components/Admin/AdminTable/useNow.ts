import { useEffect, useState } from "react";

/**
 * The current time, refreshed every `intervalMs`. The tables classify rows as
 * today / upcoming / past against this, so a screen left open over lunch
 * moves finished appointments into Past on its own.
 *
 * Lives here rather than in src/hooks: that barrel re-exports GSAP (which
 * registers ScrollTrigger at import), and importing it would pull the
 * animation library into every admin chunk.
 */
export default function useNow(intervalMs = 60_000): Date {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), intervalMs);
        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
}
