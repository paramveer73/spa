import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const DURATION_MS = 2000;
const HOLD_MS = 200;
const FADE_MS = 700;

export interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * A 0-100 counter that holds the viewport while the hero photography decodes.
 *
 * Progress is derived from wall-clock elapsed time rather than by counting
 * ticks. A naive `setInterval(20ms)` counter silently stretches to 8s+ when the
 * browser throttles timers — background tabs, low-power mode, a hidden preview
 * pane — because it needs 100 ticks to land no matter how late each one is.
 * Reading the clock means a throttled frame simply jumps the number forward and
 * the splash still clears in 2s.
 *
 * A wall-clock guard also guarantees `onComplete` fires even if rAF stops
 * entirely (fully backgrounded tab), so the site can never be left behind it.
 */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [count, setCount] = useState(0);
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const timers: number[] = [];

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setCount(100);
      timers.push(window.setTimeout(() => setExiting(true), HOLD_MS));
      timers.push(window.setTimeout(onComplete, HOLD_MS + FADE_MS));
    };

    const tick = () => {
      const progress = Math.min(1, (performance.now() - start) / DURATION_MS);
      setCount(Math.round(progress * 100));
      if (progress >= 1) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // Safety net: if rAF never runs (hidden tab), still tear the splash down.
    timers.push(window.setTimeout(finish, DURATION_MS + 100));

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
    };
  }, [onComplete]);

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        bgcolor: "background.default",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* Wordmark, top-left — the counter anchors bottom-left to balance it. */}
      <Box sx={{ position: "absolute", top: { xs: 24, md: 40 }, left: { xs: 24, md: 40 } }}>
        <Typography sx={{ fontWeight: 800, letterSpacing: "0.3em", fontSize: { xs: 11, md: 13 } }}>
          KTLN STUDIO
        </Typography>
        <Typography variant="overline" sx={{ color: "text.secondary", fontSize: { xs: 8, md: 9 } }}>
          Clovis, California
        </Typography>
      </Box>

      <Typography
        sx={{
          fontVariantNumeric: "tabular-nums",
          fontWeight: 800,
          lineHeight: 0.8,
          fontSize: { xs: "4.5rem", md: "8rem" },
          p: { xs: 3, md: 5 },
          color: "text.primary",
        }}
      >
        {count}
      </Typography>

      {/* Progress rule sweeping the full width as the count climbs. */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          width: `${count}%`,
          bgcolor: "primary.main",
          transition: "width .12s linear",
        }}
      />
    </Box>
  );
}
