import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * A rotating 3D point cloud, projected to 2D on a canvas by hand.
 *
 * Canvas 2D rather than WebGL because the particle count that reads well here
 * (~1200) is well inside what the CPU can transform per frame, and staying on
 * the 2D context means real text metrics — the cloud is *shaped from the
 * headline itself*, sampled out of an offscreen canvas, so the word appears to
 * be built from dust.
 *
 * Self-contained: takes only display strings, imports nothing from the app.
 */

const PARTICLE_TARGET = 1300;
const FOCAL = 620;

interface Particle {
  /** Home position in model space. */
  hx: number; hy: number; hz: number;
  /** Current position — springs back toward home after being pushed. */
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  size: number;
}

/**
 * Samples `word` into a pixel mask and returns one particle per filled pixel,
 * thinned to roughly PARTICLE_TARGET. Depth is randomised into a slab so the
 * flat glyph mask becomes a volume.
 */
function particlesFromText(word: string, fontFamily: string): Particle[] {
  const off = document.createElement("canvas");
  const ctx = off.getContext("2d");
  if (!ctx) return [];

  const W = (off.width = 900);
  const H = (off.height = 300);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 210px ${fontFamily}`;
  ctx.fillText(word, W / 2, H / 2);

  const { data } = ctx.getImageData(0, 0, W, H);
  const hits: [number, number][] = [];
  // Step 3px: sampling every pixel yields ~40k points, far more than needed.
  for (let y = 0; y < H; y += 3) {
    for (let x = 0; x < W; x += 3) {
      if (data[(y * W + x) * 4 + 3] > 128) hits.push([x, y]);
    }
  }

  const stride = Math.max(1, Math.floor(hits.length / PARTICLE_TARGET));
  const out: Particle[] = [];
  for (let i = 0; i < hits.length; i += stride) {
    const [x, y] = hits[i];
    const hx = x - W / 2;
    const hy = y - H / 2;
    const hz = (Math.random() - 0.5) * 90;
    out.push({
      hx, hy, hz,
      x: hx, y: hy, z: hz,
      vx: 0, vy: 0, vz: 0,
      size: 0.7 + Math.random() * 1.5,
    });
  }
  return out;
}

export interface ParticleFieldHeroProps {
  eyebrow?: string;
  /** Single word works best — it is rasterised into the point cloud. */
  word: string;
  subtitle?: string;
  color?: string;
  background?: string;
}

export default function ParticleFieldHero({
  eyebrow,
  word,
  subtitle,
  color = "#E9D9C6",
  background = "#0C0B0F",
}: ParticleFieldHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let particles = particlesFromText(word, "Open Sauce One, sans-serif");
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

    const pointer = { x: 0, y: 0, active: false };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left - rect.width / 2;
      pointer.y = e.clientY - rect.top - rect.height / 2;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let frame = 0;
    let angle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);

      // Scale the model to the viewport so the word always fits.
      const fit = Math.min(w / (900 * dpr), 1) * dpr;
      angle += reduced ? 0 : 0.0024;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      for (const p of particles) {
        // Spring home, with damping — this is what makes the cloud re-form.
        p.vx += (p.hx - p.x) * 0.012;
        p.vy += (p.hy - p.y) * 0.012;
        p.vz += (p.hz - p.z) * 0.012;

        if (pointer.active) {
          const dx = p.x * fit - pointer.x * dpr;
          const dy = p.y * fit - pointer.y * dpr;
          const distSq = dx * dx + dy * dy;
          // Inverse-square shove, clamped so particles near the cursor do not
          // acquire absurd velocity and fly off screen.
          if (distSq < 26000) {
            const force = (26000 - distSq) / 26000;
            const dist = Math.max(Math.sqrt(distSq), 8);
            p.vx += (dx / dist) * force * 5.2;
            p.vy += (dy / dist) * force * 5.2;
            p.vz += force * 3.0;
          }
        }

        p.vx *= 0.9; p.vy *= 0.9; p.vz *= 0.9;
        p.x += p.vx; p.y += p.vy; p.z += p.vz;

        // Y-axis rotation, then weak perspective divide.
        const rx = p.x * cos - p.z * sin;
        const rz = p.x * sin + p.z * cos;
        const scale = FOCAL / (FOCAL + rz);
        const sx = rx * scale * fit;
        const sy = p.y * scale * fit;

        // Depth drives both size and alpha, which is what sells the volume.
        ctx.globalAlpha = Math.max(0.06, Math.min(1, scale - 0.35));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * scale * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      particles = [];
    };
  }, [word, color, background]);

  return (
    <Box sx={{ position: "relative", height: "100dvh", width: "100%", overflow: "hidden", bgcolor: background }}>
      <Box
        component="canvas"
        ref={canvasRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />

      {/* The cloud is decorative; the real heading stays in the DOM for
          screen readers and SEO, visually hidden behind the canvas. */}
      <Typography component="h1" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {word}
      </Typography>

      <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", p: { xs: 3, md: 8 }, pointerEvents: "none" }}>
        {eyebrow && (
          <Typography sx={{ fontSize: { xs: 10, md: 12 }, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>
            {eyebrow}
          </Typography>
        )}
        {subtitle && (
          <Typography sx={{ maxWidth: 420, fontSize: { xs: 13, md: 16 }, color: "rgba(255,255,255,.7)" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
