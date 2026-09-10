import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * A 3D wireframe surface rippling like silk, projected by hand onto a canvas.
 *
 * The surface is a grid of vertices displaced on Y by summed sine waves —
 * three of them at different frequencies and angles, which is what stops the
 * motion reading as one obvious repeating ripple. Vertices are rotated on X
 * (camera pitch) and perspective-divided, then drawn as connected rows and
 * columns.
 *
 * Rows are stroked back-to-front so nearer rows overdraw farther ones, giving
 * occlusion without a depth buffer.
 *
 * Self-contained: takes only display strings, imports nothing from the app.
 */

const COLS = 46;
const ROWS = 30;
const SPACING = 42;
const FOCAL = 520;
const PITCH = 1.02; // radians

export interface WaveMeshHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: string;
  background?: string;
}

export default function WaveMeshHero({
  eyebrow,
  title,
  subtitle,
  accent = "#B08968",
  background = "#07070A",
}: WaveMeshHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Reused across frames so the projection loop allocates nothing.
    const px = new Float32Array(COLS * ROWS);
    const py = new Float32Array(COLS * ROWS);
    const pd = new Float32Array(COLS * ROWS);

    let frame = 0;
    const start = performance.now();

    const render = () => {
      const t = reduced ? 6 : (performance.now() - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      eased.x += (pointer.x - eased.x) * 0.04;
      eased.y += (pointer.y - eased.y) * 0.04;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
      ctx.translate(w / 2, h * 0.62);

      const scale = Math.min(w / (COLS * SPACING * dpr), 1.15) * dpr;
      const pitch = PITCH + eased.y * 0.28;
      const sinP = Math.sin(pitch);
      const cosP = Math.cos(pitch);

      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          const x = (c - COLS / 2) * SPACING;
          const z = (r - ROWS / 2) * SPACING;

          // Three summed waves — different speeds, directions and wavelengths.
          const y =
            Math.sin(x * 0.011 + t * 1.15) * 26 +
            Math.sin(z * 0.015 - t * 0.85) * 22 +
            Math.sin((x + z) * 0.008 + t * 0.55) * 30;

          // Pitch the camera down over the surface.
          const ry = y * cosP - z * sinP;
          const rz = y * sinP + z * cosP + 620;
          const persp = FOCAL / Math.max(rz, 1);

          const i = r * COLS + c;
          px[i] = (x + eased.x * 220) * persp * scale;
          py[i] = ry * persp * scale;
          pd[i] = persp;
        }
      }

      ctx.lineWidth = Math.max(1, 0.9 * dpr);

      // Back-to-front: nearer rows paint over farther ones.
      for (let r = ROWS - 1; r >= 0; r -= 1) {
        const depth = pd[r * COLS];
        const alpha = Math.max(0, Math.min(0.9, (depth - 0.42) * 1.9));
        if (alpha <= 0.01) continue;

        // Crest lines pick up the accent; troughs stay neutral.
        ctx.strokeStyle = r % 4 === 0 ? accent : "rgba(255,255,255,.42)";
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        for (let c = 0; c < COLS; c += 1) {
          const i = r * COLS + c;
          if (c === 0) ctx.moveTo(px[i], py[i]);
          else ctx.lineTo(px[i], py[i]);
        }
        ctx.stroke();
      }

      // Sparse columns tie the rows together without turning it into a solid.
      ctx.strokeStyle = "rgba(255,255,255,.16)";
      for (let c = 0; c < COLS; c += 3) {
        ctx.beginPath();
        for (let r = 0; r < ROWS; r += 1) {
          const i = r * COLS + c;
          ctx.globalAlpha = Math.max(0, Math.min(0.5, (pd[i] - 0.42) * 1.5));
          if (r === 0) ctx.moveTo(px[i], py[i]);
          else ctx.lineTo(px[i], py[i]);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [accent, background]);

  return (
    <Box sx={{ position: "relative", height: "100dvh", width: "100%", overflow: "hidden", bgcolor: background }}>
      <Box
        component="canvas"
        ref={canvasRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />

      {/* Horizon glow anchors the mesh so it does not float in a void. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 70% 42% at 50% 62%, ${accent}22, transparent 70%),
                       linear-gradient(180deg, ${background} 4%, transparent 34%, ${background} 96%)`,
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 3, md: 8 },
          pointerEvents: "none",
        }}
      >
        {eyebrow && (
          <Typography sx={{ fontSize: { xs: 10, md: 12 }, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: accent, mb: 2 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography
          component="h1"
          sx={{
            fontSize: "clamp(2.8rem,10vw,9rem)",
            fontWeight: 800,
            lineHeight: 0.84,
            letterSpacing: "-0.04em",
            color: "#fff",
            maxWidth: 900,
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ mt: 3, maxWidth: 440, fontSize: { xs: 13, md: 16 }, color: "rgba(255,255,255,.72)" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
