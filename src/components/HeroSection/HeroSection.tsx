import { useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Wordmark from "@/components/Wordmark";
import { useGsapContext, usePointerParallax, gsap } from "@/hooks";
import { scrollToBooking } from "@/utils/scroll";
import { PORTRAITS, brand, business, home } from "@/data";
import { BRAND, SERIF_STACK } from "@/theme";

/** Five glyphs rather than an icon package — this is a rating mark, not UI. */
const STARS = "★★★★★";

/**
 * Specks of light around the headline. Positions and delays are hand-picked so
 * the twinkle never falls into a visible rhythm or a straight line.
 */
const SPARKLES = [
  { top: "14%", left: "9%", size: 5, delay: "0s" },
  { top: "34%", left: "20%", size: 3, delay: "1.7s" },
  { top: "11%", right: "13%", size: 4, delay: "0.9s" },
  { top: "41%", right: "8%", size: 6, delay: "2.6s" },
  { top: "62%", left: "14%", size: 3, delay: "3.4s" },
  { top: "57%", right: "18%", size: 4, delay: "4.2s" },
] as const;

/** Rounded at the top, square at the fold — the photo runs off the bottom edge. */
const ARCH_RADIUS = "999px 999px 0 0";

export interface HeroSectionProps {
  /** Splash has torn down — safe to play the entrance against final layout. */
  ready: boolean;
}

/**
 * Quiet, centred, mostly empty space: a serif headline on cream, one arch of
 * photography rising from the fold, and light that moves slowly behind it all.
 * The old stacked photo cards read as editorial sportswear — loud where a
 * studio should feel calm.
 */
export default function HeroSection({ ready }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const archRef = useRef<HTMLDivElement | null>(null);

  // Barely-there tilt on the photo alone. GSAP owns the wrapper's transform,
  // so the parallax writes to the inner frame and the two never fight.
  usePointerParallax(archRef, { maxTilt: 3.5 });

  useGsapContext(
    sectionRef,
    () => {
      if (!ready) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-glow]", { autoAlpha: 0, duration: 1.8 }, 0)
        .from("[data-hero-line]", { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.13 }, 0.15)
        // The arch rises last and slowest, so the page settles rather than lands.
        .from("[data-hero-arch]", { y: 60, scale: 0.94, autoAlpha: 0, duration: 1.3 }, 0.5);
    },
    [ready]
  );

  return (
    <Box
      component="section"
      id="home"
      ref={sectionRef}
      sx={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.default",
        textAlign: "center",
        pt: { xs: 13, md: 16 },
        px: { xs: 2.5, md: 4 },
      }}
    >
      {/* 1. Aura — two slow pools of warm light, plus specks that twinkle */}
      <Box
        aria-hidden
        data-hero-glow
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          "@keyframes heroDrift": {
            "0%, 100%": { transform: "translate3d(-50%, 0, 0) scale(1)" },
            "50%": { transform: "translate3d(-50%, 4%, 0) scale(1.08)" },
          },
          "@keyframes heroTwinkle": {
            "0%, 100%": { opacity: 0, transform: "scale(0.6)" },
            "50%": { opacity: 0.9, transform: "scale(1)" },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "-26%",
            left: "50%",
            width: "min(1000px, 130vw)",
            height: "min(1000px, 130vw)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(BRAND.accent, 0.3)} 0%, transparent 62%)`,
            filter: "blur(24px)",
            animation: "heroDrift 17s ease-in-out infinite",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "18%",
            left: "50%",
            width: "min(760px, 105vw)",
            height: "min(760px, 105vw)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(BRAND.accentSoft, 0.42)} 0%, transparent 66%)`,
            filter: "blur(30px)",
            animation: "heroDrift 23s ease-in-out infinite reverse",
          }}
        />
        {SPARKLES.map((speck) => (
          <Box
            key={`${speck.top}-${speck.delay}`}
            sx={{
              position: "absolute",
              top: speck.top,
              left: "left" in speck ? speck.left : undefined,
              right: "right" in speck ? speck.right : undefined,
              width: speck.size,
              height: speck.size,
              borderRadius: "50%",
              // White specks vanish against the cream page; on the dark palette
              // they're the only thing bright enough to read as light.
              bgcolor: (theme) => (theme.palette.mode === "light" ? BRAND.accent : "common.white"),
              boxShadow: (theme) =>
                `0 0 10px 2px ${alpha(theme.palette.mode === "light" ? BRAND.accentSoft : BRAND.accent, 0.9)}`,
              opacity: 0,
              animation: `heroTwinkle 6s ease-in-out ${speck.delay} infinite`,
            }}
          />
        ))}
      </Box>

      {/* 2. The words */}
      <Box sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 900, mx: "auto" }}>
        <Box data-hero-line>
          <Wordmark size="md" align="center" />
        </Box>

        <Typography
          data-hero-line
          component="h1"
          sx={{
            mt: { xs: 3, md: 4 },
            fontFamily: SERIF_STACK,
            fontSize: "clamp(3.4rem, 11vw, 9rem)",
            fontWeight: 300,
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            color: "text.primary",
          }}
        >
          {brand.copy.hero.headline[0]}
          <br />
          {/* Second line in italic accent: the one flourish in the composition. */}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 400, color: "primary.main" }}>
            {brand.copy.hero.headline[1]}
          </Box>
        </Typography>

        {/* The line that has to land: what the studio is known for, and where. */}
        <Box
          data-hero-line
          sx={{
            mt: { xs: 3, md: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 1.5, md: 3 },
          }}
        >
          <Rule />
          <Typography
            component="p"
            variant="overline"
            sx={{
              fontSize: { xs: 10, md: 13 },
              lineHeight: 1.4,
              color: "text.primary",
              whiteSpace: { xs: "normal", sm: "nowrap" },
            }}
          >
            {brand.copy.hero.secondary}
          </Typography>
          <Rule />
        </Box>

        <Box
          data-hero-line
          sx={{
            mt: { xs: 3.5, md: 4.5 },
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <Button
            onClick={scrollToBooking}
            variant="contained"
            sx={{
              px: { xs: 3.5, md: 5 },
              py: { xs: 1.4, md: 1.7 },
              fontSize: { xs: "0.85rem", md: "0.95rem" },
              bgcolor: "text.primary",
              color: "background.default",
              "&:hover": { bgcolor: "text.primary", transform: "translateY(-2px)" },
            }}
          >
            {brand.copy.bookingCta}
          </Button>
          <Button
            href={`tel:${business.phone}`}
            variant="outlined"
            sx={{
              px: { xs: 3.5, md: 5 },
              py: { xs: 1.4, md: 1.7 },
              fontSize: { xs: "0.85rem", md: "0.95rem" },
              color: "text.primary",
              borderColor: "divider",
              "&:hover": { borderColor: "text.primary", bgcolor: "transparent", transform: "translateY(-2px)" },
            }}
          >
            {business.phone}
          </Button>
        </Box>

        <Box
          data-hero-line
          sx={{
            mt: { xs: 3, md: 4 },
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 1.25,
          }}
        >
          <Box component="span" sx={{ color: "secondary.main", fontSize: 12, letterSpacing: "0.14em" }}>
            {STARS}
          </Box>
          <Typography component="span" variant="overline" sx={{ color: "text.secondary", fontSize: { xs: 9, md: 10 } }}>
            {home.hero.socialProof}
          </Typography>
        </Box>
      </Box>

      {/* 3. Arch of photography, running off the fold so the page invites a scroll */}
      <Box
        data-hero-arch
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          minHeight: { xs: 180, md: 240 },
          mt: { xs: 5, md: 7 },
          mx: "auto",
          width: { xs: "min(330px, 80vw)", md: "min(560px, 46vw)" },
          perspective: "1200px",
        }}
      >
        <Box
          ref={archRef}
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: ARCH_RADIUS,
            overflow: "hidden",
            boxShadow: `0 40px 90px ${alpha(BRAND.brownDeep, 0.3)}`,
            "@keyframes heroShimmer": {
              "0%, 62%": { transform: "translateX(-130%)" },
              "100%": { transform: "translateX(130%)" },
            },
          }}
        >
          <Box
            component="img"
            src={PORTRAITS.brows}
            alt={`Microblading at ${brand.name}`}
            sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%" }}
          />
          {/* Softens the cut where the photo meets the background. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background: (theme) =>
                `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.55)} 0%, transparent 34%)`,
            }}
          />
          {/* A slow pass of light across the glass, every few seconds. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(100deg, transparent 32%, rgba(255,255,255,.32) 48%, transparent 64%)",
              animation: "heroShimmer 8s ease-in-out infinite",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/** Hairline flanking the secondary line. */
function Rule() {
  return <Box aria-hidden sx={{ width: { xs: 28, md: 64 }, height: "1px", bgcolor: "divider", flexShrink: 0 }} />;
}
