import { useLayoutEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { gsap } from "@/hooks";
import { brand } from "@/data/brand";
import { BRAND } from "@/theme/buildTheme";

gsap.registerPlugin(DrawSVGPlugin, SplitText);

/** Never hold the visitor hostage — bail out even if an asset stalls. */
const MAX_WAIT = 3200;
/** …but don't flash either: the stroke and the wordmark need this long to land. */
const MIN_SHOW = 2200;

/**
 * Three sheer layers, lifted front to back on the way out. Each is taller than
 * the viewport with a feathered lower edge, so as it rises it reads as fabric
 * drawing up rather than a hard panel sliding — the veil motif the rest of the
 * site already uses.
 */
const VEILS = [
  `linear-gradient(160deg, ${BRAND.ink} 0%, ${BRAND.brownDeep} 100%)`,
  `linear-gradient(170deg, rgba(92, 70, 52, 0.55) 0%, rgba(61, 46, 33, 0.35) 100%)`,
  `linear-gradient(180deg, rgba(217, 194, 172, 0.10) 0%, rgba(176, 137, 104, 0.06) 100%)`,
];

const settled = () =>
  Promise.all([
    new Promise<void>((resolve) =>
      document.readyState === "complete"
        ? resolve()
        : window.addEventListener("load", () => resolve(), { once: true })
    ),
    document.fonts?.ready ?? Promise.resolve(),
  ]);

export interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * The intro: a single hairline stroke draws itself on — the one gesture of the
 * craft, a microblading stroke — and the wordmark resolves beneath it, its
 * tracking breathing out from tight to the wide set the studio chose. A counter
 * runs against a real load signal, then three veils lift to hand over to the
 * hero.
 *
 * Deliberately not built on useGsapContext. That hook does nothing at all under
 * reduced motion, which is right for page sections that already rest in their
 * final state — but here the exit is what calls onComplete, so skipping it
 * would leave a reduced-motion visitor staring at a frozen splash until the
 * failsafe fired. The lifecycle always runs; only the motion is calmed.
 *
 * HomePage unmounts this the moment onComplete fires, so it is called only
 * once the veils have fully cleared — earlier and they would vanish mid-lift.
 *
 * Progress climbs to 92% on a curve and completes only once the window has
 * loaded and the webfonts resolved, so the hero never reflows under the
 * visitor. A wall-clock failsafe still clears it if rAF stops entirely.
 */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const root = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  // Latest callback, kept outside render: the effect below runs once, and must
  // still call whatever onComplete is current when the veils finally clear.
  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  const [strokeId] = useState(() => `splash-stroke-${Math.random().toString(36).slice(2, 8)}`);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pick = <T,>(full: T, calm: T) => (reduced ? calm : full);

    /* On <html>, not <body>. The navbar mounts alongside this and writes
       document.body.style.overflow = "" when its menu is closed, which cleared
       a body lock before the first frame. The root element's overflow is the
       one the viewport takes, so this holds whatever happens to body's. */
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const progress = { v: 0 };
    const paint = () => {
      if (countRef.current) countRef.current.textContent = String(Math.round(progress.v)).padStart(3, "0");
    };

    // The load promise outlives the effect; without this, StrictMode's double
    // mount in dev leaves the first chain alive and the exit runs twice.
    let cancelled = false;
    let finished = false;

    const release = () => {
      html.style.overflow = previousOverflow;
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(failsafe);
      release();
      onCompleteRef.current();
    };

    // rAF, and GSAP with it, can stop in a background tab; setTimeout runs on
    // wall clock, so the visitor can never be left locked behind the splash.
    const failsafe = window.setTimeout(finish, MAX_WAIT + MIN_SHOW + 4000);

    let split: SplitText | null = null;

    const ctx = gsap.context(() => {
      const primary = node.querySelector<HTMLElement>(".splash__primary");
      split = primary ? new SplitText(primary, { type: "chars", charsClass: "splash__char" }) : null;

      /* ── Entrance ─────────────────────────────────────────────────── */
      const intro = gsap.timeline();
      intro.set(".splash__stage", { autoAlpha: 1 });

      intro.fromTo(
        ".splash__glow",
        { autoAlpha: 0, scale: pick(0.7, 1) },
        { autoAlpha: 1, scale: 1, duration: pick(2.2, 0.8), ease: "power2.out" },
        0
      );

      if (reduced) {
        intro.from(".splash__stroke", { autoAlpha: 0, duration: 0.6 }, 0.1);
      } else {
        intro.fromTo(
          ".splash__stroke path",
          { drawSVG: "0%" },
          { drawSVG: "100%", duration: 1.5, ease: "power2.inOut" },
          0.15
        );
      }

      if (split) {
        intro.from(
          split.chars,
          {
            autoAlpha: 0,
            y: pick(10, 0),
            filter: pick("blur(12px)", "blur(0px)"),
            duration: pick(1.1, 0.5),
            stagger: pick(0.09, 0),
            ease: "power3.out",
          },
          pick(0.5, 0.2)
        );
      }

      // The breath: tracking eases out from tight to the studio's wide set.
      intro
        .fromTo(
          ".splash__primary",
          { letterSpacing: pick("0.04em", "0.34em") },
          { letterSpacing: "0.34em", duration: pick(2.2, 0.01), ease: "expo.out" },
          pick(0.5, 0)
        )
        .fromTo(
          ".splash__secondary",
          { autoAlpha: 0, letterSpacing: pick("0.1em", "0.62em") },
          { autoAlpha: 1, letterSpacing: "0.62em", duration: pick(1.6, 0.5), ease: "expo.out" },
          pick(1.05, 0.3)
        )
        .from(".splash__location", { autoAlpha: 0, y: pick(8, 0), duration: pick(0.9, 0.5), ease: "power2.out" }, pick(1.4, 0.4))
        .from(".splash__rule", { scaleX: 0, duration: pick(1.2, 0.5), ease: "power3.inOut" }, pick(0.3, 0.1))
        .from(".splash__counter", { autoAlpha: 0, y: pick(16, 0), duration: pick(0.9, 0.5) }, pick(0.45, 0.1));

      /* ── Honest-ish progress ──────────────────────────────────────── */
      gsap.to(progress, { v: 92, duration: MIN_SHOW / 1000, ease: "power1.out", onUpdate: paint });
      gsap.fromTo(".splash__fill", { scaleX: 0 }, { scaleX: 0.92, duration: MIN_SHOW / 1000, ease: "power1.out" });
    }, node);

    /* ── Exit ───────────────────────────────────────────────────────── */
    const runOut = () => {
      if (finished || cancelled) return;
      ctx.add(() => {
        gsap
          .timeline({ onComplete: finish })
          .to(progress, { v: 100, duration: 0.45, ease: "power2.inOut", onUpdate: paint })
          .to(".splash__fill", { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, "<")
          // The wordmark breathes out again as it leaves.
          .to(".splash__primary", { letterSpacing: pick("0.5em", "0.34em"), duration: pick(1, 0.3), ease: "power2.in" }, "-=0.1")
          .to(
            [".splash__char", ".splash__secondary", ".splash__location"],
            { autoAlpha: 0, y: pick(-10, 0), filter: pick("blur(10px)", "blur(0px)"), duration: pick(0.7, 0.35), stagger: pick(0.03, 0), ease: "power2.in" },
            "<0.2"
          )
          .to(".splash__stroke", { autoAlpha: 0, scaleX: pick(1.15, 1), duration: pick(0.7, 0.35), ease: "power2.in" }, "<")
          .to(".splash__glow", { autoAlpha: 0, scale: pick(1.25, 1), duration: 0.8, ease: "power2.in" }, "<")
          .to([".splash__counter", ".splash__rule"], { autoAlpha: 0, duration: 0.4 }, "<0.1")
          // Front sheer first, the opaque field last, so the site appears
          // under a soft trailing edge rather than all at once.
          .to(
            [...node.querySelectorAll(".splash__veil")].reverse(),
            pick<gsap.TweenVars>(
              { yPercent: -118, duration: 1.15, stagger: 0.12, ease: "expo.inOut" },
              { autoAlpha: 0, duration: 0.55, ease: "power2.out" }
            ),
            "-=0.35"
          );
      });
    };

    const start = performance.now();
    Promise.race([settled(), new Promise((resolve) => setTimeout(resolve, MAX_WAIT))]).then(() => {
      if (cancelled) return;
      const held = performance.now() - start;
      window.setTimeout(runOut, Math.max(0, MIN_SHOW - held));
    });

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      split?.revert();
      ctx.revert();
      release();
    };
  }, []);

  const warmText = "rgba(245, 239, 232, 0.94)";

  return (
    <Box
      ref={root}
      aria-hidden
      sx={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden", pointerEvents: "auto" }}
    >
      {VEILS.map((background, index) => (
        <Box
          key={index}
          className="splash__veil"
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            // Taller than the screen, feathered at the bottom, so the lift has
            // a soft trailing edge instead of a hard line.
            height: "118%",
            background,
            maskImage: "linear-gradient(to bottom, #000 84%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 84%, transparent 100%)",
            willChange: "transform",
            zIndex: index,
          }}
        />
      ))}

      <Box
        className="splash__glow"
        sx={{
          position: "absolute",
          left: "50%",
          top: "46%",
          width: "min(92vmin, 780px)",
          aspectRatio: "1",
          translate: "-50% -50%",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(176, 137, 104, 0.24) 0%, rgba(176, 137, 104, 0.08) 38%, transparent 66%)`,
          pointerEvents: "none",
          zIndex: VEILS.length,
        }}
      />

      <Box
        className="splash__stage"
        sx={{
          position: "relative",
          zIndex: VEILS.length + 1,
          height: "100%",
          display: "grid",
          placeItems: "center",
          px: 3,
          // Revealed by the intro so nothing paints before GSAP has set it up.
          visibility: "hidden",
        }}
      >
        <Box sx={{ display: "grid", justifyItems: "center", textAlign: "center" }}>
          {/* One hairline stroke, tapered at both ends by the gradient — the
              gesture of the craft rather than an invented mark. */}
          <Box
            component="svg"
            className="splash__stroke"
            viewBox="0 0 420 44"
            sx={{ width: { xs: 220, md: 340 }, height: "auto", overflow: "visible", mb: { xs: 2.5, md: 3.5 } }}
          >
            <defs>
              <linearGradient id={strokeId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor={BRAND.accentSoft} stopOpacity="0" />
                <stop offset="0.28" stopColor={BRAND.accentSoft} stopOpacity="0.95" />
                <stop offset="0.72" stopColor={BRAND.accent} stopOpacity="0.95" />
                <stop offset="1" stopColor={BRAND.accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M6 34 C 96 6, 214 2, 300 14 S 396 30, 414 22"
              fill="none"
              stroke={`url(#${strokeId})`}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </Box>

          <Box
            component="p"
            className="splash__primary"
            sx={{
              m: 0,
              color: warmText,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.34em",
              // Tracking adds space after the last letter too; this balances
              // the centred line, as the Wordmark does.
              textIndent: "0.34em",
              lineHeight: 1,
              fontSize: { xs: "3.25rem", sm: "4.5rem", md: "6rem" },
            }}
          >
            {brand.wordmark.primary}
          </Box>

          <Box
            component="p"
            className="splash__secondary"
            sx={{
              m: 0,
              mt: { xs: 1.5, md: 2 },
              color: BRAND.accentSoft,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.62em",
              textIndent: "0.62em",
              fontSize: { xs: "0.72rem", md: "0.9rem" },
            }}
          >
            {brand.wordmark.secondary}
          </Box>

          <Box
            component="p"
            className="splash__location"
            sx={{
              m: 0,
              mt: { xs: 3, md: 4 },
              color: "rgba(217, 194, 172, 0.62)",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontSize: { xs: "0.62rem", md: "0.7rem" },
            }}
          >
            {brand.location}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: VEILS.length + 1,
          px: { xs: 3, md: 5 },
          pb: { xs: 3, md: 4.5 },
          display: "grid",
          gap: { xs: 2, md: 2.5 },
        }}
      >
        <Box
          className="splash__counter"
          sx={{ display: "flex", alignItems: "baseline", gap: 0.5, color: warmText, lineHeight: 0.85 }}
        >
          <Box
            component="span"
            ref={countRef}
            sx={{ fontWeight: 400, fontSize: { xs: "3.5rem", md: "6rem" }, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}
          >
            000
          </Box>
          <Box component="span" sx={{ fontSize: { xs: "0.9rem", md: "1.2rem" }, color: BRAND.accent }}>
            %
          </Box>
        </Box>

        <Box
          className="splash__rule"
          sx={{ position: "relative", height: "1px", bgcolor: "rgba(217, 194, 172, 0.16)", transformOrigin: "left center" }}
        >
          <Box
            className="splash__fill"
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: BRAND.accent,
              transformOrigin: "left center",
              transform: "scaleX(0)",
              boxShadow: "0 0 12px rgba(176, 137, 104, 0.6)",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
