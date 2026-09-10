import { useEffect, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import gsap from "gsap";

/**
 * An infinite corridor of planes flying past the camera, built with real CSS
 * 3D rather than a canvas.
 *
 * Why CSS: the planes can hold live DOM — images, text, anything — and the
 * compositor transforms them on the GPU for free. A canvas version would have
 * to re-draw every frame and could not contain selectable content.
 *
 * The loop is a modulo on translateZ: each plane marches toward the camera and
 * wraps to the back of the corridor when it passes, so a fixed set of nodes
 * reads as an endless tunnel.
 *
 * Self-contained: takes only display strings, imports nothing from the app.
 */

const RING_COUNT = 14;
const DEPTH = 380;
const TUNNEL = RING_COUNT * DEPTH;

export interface DepthTunnelHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Repeated around the corridor walls. */
  words?: string[];
  accent?: string;
  background?: string;
}

export default function DepthTunnelHero({
  eyebrow,
  title,
  subtitle,
  words = ["PRECISION", "ARTISTRY", "DETAIL", "CRAFT"],
  accent = "#B08968",
  background = "#08070A",
}: DepthTunnelHeroProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const planesRef = useRef<(HTMLDivElement | null)[]>([]);

  const rings = useMemo(
    () => Array.from({ length: RING_COUNT }, (_, i) => ({ i, word: words[i % words.length] })),
    [words]
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const planes = planesRef.current.filter(Boolean) as HTMLDivElement[];
    if (!planes.length) return undefined;

    const state = { travel: 0 };
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const draw = () => {
      eased.x += (pointer.x - eased.x) * 0.05;
      eased.y += (pointer.y - eased.y) * 0.05;

      planes.forEach((plane, i) => {
        // Wrap into [0, TUNNEL) so planes recycle instead of running away.
        const z = ((i * DEPTH + state.travel) % TUNNEL + TUNNEL) % TUNNEL;
        // Camera sits at z=0 looking down -Z; shift so planes approach from far.
        const zc = z - TUNNEL;
        // Fade in from the far end and out as it passes the lens.
        const near = 1 - Math.min(1, Math.abs(zc + 300) / 700);
        const spin = i * 6;
        plane.style.transform = `translate(-50%, -50%) translateZ(${zc}px) rotateZ(${spin}deg)`;
        plane.style.opacity = String(Math.max(0, Math.min(1, near * 1.35)));

        const label = plane.firstElementChild as HTMLElement | null;
        if (label) label.style.transform = `rotateZ(${-spin}deg)`;
      });

      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `rotateY(${eased.x * 7}deg) rotateX(${-eased.y * 7}deg)`;
      }
    };

    let tween: gsap.core.Tween | undefined;
    if (reduced) {
      draw();
    } else {
      // GSAP drives the scalar; the per-frame transform writing happens in
      // onUpdate so there is one place computing layout per frame.
      tween = gsap.to(state, {
        travel: TUNNEL,
        duration: 26,
        ease: "none",
        repeat: -1,
        onUpdate: draw,
      });
    }

    return () => {
      tween?.kill();
      window.removeEventListener("pointermove", onMove);
    };
  }, [rings.length]);

  return (
    <Box
      sx={{
        position: "relative",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        bgcolor: background,
        perspective: "780px",
        perspectiveOrigin: "50% 50%",
      }}
    >
      <Box
        ref={sceneRef}
        sx={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {rings.map(({ i, word }) => (
          <Box
            key={i}
            ref={(node: HTMLDivElement | null) => { planesRef.current[i] = node; }}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: { xs: 340, md: 780 },
              height: { xs: 340, md: 780 },
              transformStyle: "preserve-3d",
              border: "1px solid",
              borderColor: i % 3 === 0 ? accent : "rgba(255,255,255,.28)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 22, md: 40 },
                fontWeight: 800,
                letterSpacing: "0.3em",
                color: i % 3 === 0 ? accent : "rgba(255,255,255,.4)",
              }}
            >
              {word}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Depth haze: hides the far end of the corridor so it fades to black
          instead of terminating in a visible last plane. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 50%, transparent 52%, ${background} 96%)`,
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
          alignItems: "center",
          textAlign: "center",
          px: 3,
          pointerEvents: "none",
        }}
      >
        {eyebrow && (
          <Typography sx={{ fontSize: { xs: 10, md: 12 }, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: accent, mb: 3 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography
          component="h1"
          sx={{
            fontSize: "clamp(2.8rem,9vw,8rem)",
            fontWeight: 800,
            lineHeight: 0.86,
            letterSpacing: "-0.04em",
            color: "#fff",
            textShadow: `0 0 90px ${background}`,
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
