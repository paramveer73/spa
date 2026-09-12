import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MaskedCard from "@/components/MaskedCard";
import {
  useGsapContext,
  useImageAspect,
  useIsMobile,
  useMaskPositions,
  usePointerParallax,
  gsap,
} from "@/hooks";
import { BACKDROPS, brand, home, business } from "@/data";

const CARD_COUNT = 4;
const FOCAL = { mobile: 0.7, desktop: 0.8 };

/**
 * How far each card sits off the picture plane, in px. The proof bars step
 * progressively forward and the main card sits furthest back, so the stack
 * reads as receding into the frame rather than as one flat sheet.
 */
const CARD_DEPTH = [90, 62, 34, -30];

/** Three short proof points, taken verbatim from the studio's own copy. */
const PROOF_BARS = home.about.highlights.slice(0, 3);

export interface HeroSectionProps {
  /** Splash has torn down — safe to play the entrance against final layout. */
  ready: boolean;
}

export default function HeroSection({ ready }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const isMobile = useIsMobile();

  const positions = useMaskPositions(sectionRef, cardsRef, CARD_COUNT);
  const imageAspect = useImageAspect(BACKDROPS.hero);
  const focalX = isMobile ? FOCAL.mobile : FOCAL.desktop;

  // Live tilt toward the cursor, applied to the stage so all four cards share
  // one camera. Self-disables on touch and under reduced motion.
  usePointerParallax(stageRef, { maxTilt: 5.5 });

  /**
   * Entrance: the stack hinges down into place from above the picture plane.
   * Each card keeps its resting translateZ throughout, so the depth ordering
   * is established from the first frame instead of snapping in at the end.
   */
  useGsapContext(
    sectionRef,
    () => {
      if (!ready) return;
      const cards = cardsRef.current.filter(Boolean) as HTMLElement[];
      if (!cards.length) return;

      gsap.timeline({ defaults: { ease: "power3.out" } }).from(cards, {
        rotateX: -68,
        y: 46,
        autoAlpha: 0,
        transformOrigin: "50% 0%",
        duration: 1.05,
        stagger: 0.11,
      });

      gsap.from("[data-hero-copy]", {
        y: 24,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.09,
        delay: 0.45,
        ease: "power3.out",
      });
    },
    [ready]
  );

  const setCardRef = (index: number) => (node: HTMLElement | null) => {
    cardsRef.current[index] = node;
  };

  return (
    <Box
      component="section"
      id="home"
      ref={sectionRef}
      sx={{
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        pt: { xs: 11, md: 12 },
        px: { xs: 1.5, md: 2.5 },
        pb: { xs: 0.75, md: 1 },
        // The camera. Everything inside is positioned in its depth space.
        perspective: { xs: "1400px", md: "1900px" },
        perspectiveOrigin: "50% 40%",
      }}
    >
      <Box
        ref={stageRef}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: { xs: 0.75, md: 1 },
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* 1. Proof bars — each a window onto the same photograph */}
        {PROOF_BARS.map((text, i) => (
          <MaskedCard
            key={text}
            cardRef={setCardRef(i)}
            bgImage={BACKDROPS.hero}
            position={positions[i]}
            imageAspect={imageAspect}
            focalX={focalX}
            style={{ transform: `translateZ(${CARD_DEPTH[i]}px)` }}
            sx={{
              width: "100%",
              height: { xs: 52, md: 76 },
              flexShrink: 0,
              transformStyle: "preserve-3d",
              // Depth cue: the closer a card sits, the harder it casts.
              boxShadow: `0 ${18 + i * 4}px ${38 + i * 8}px rgba(0,0,0,.28)`,
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                // The shared photo runs light in places; without a scrim the
                // white label disappears wherever a bar lands on skin tone.
                bgcolor: "rgba(0,0,0,.34)",
                backdropFilter: "blur(1px)",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  textAlign: "center",
                  fontSize: { xs: "0.8rem", md: "1.5rem" },
                  color: "common.white",
                  textShadow: "0 1px 18px rgba(0,0,0,.45)",
                }}
              >
                {text}
              </Typography>
            </Box>
          </MaskedCard>
        ))}

        {/* 2. Main hero card, seated furthest back in the stack */}
        <MaskedCard
          cardRef={setCardRef(3)}
          bgImage={BACKDROPS.hero}
          position={positions[3]}
          imageAspect={imageAspect}
          focalX={focalX}
          style={{ transform: `translateZ(${CARD_DEPTH[3]}px)` }}
          sx={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            transformStyle: "preserve-3d",
            boxShadow: "0 30px 80px rgba(0,0,0,.34)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.10) 34%, rgba(0,0,0,.62) 72%, rgba(0,0,0,.82) 100%)",
            }}
          />

          <Typography
            data-hero-copy
            sx={{
              position: "absolute",
              top: { xs: 16, md: 28 },
              left: { xs: 16, md: 28 },
              zIndex: 1,
              maxWidth: { xs: 200, md: 320 },
              fontSize: { xs: 11, md: 14 },
              fontWeight: 600,
              lineHeight: 1.35,
              color: "common.white",
            }}
          >
            {home.hero.subheadline}
          </Typography>

          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 20, md: 32 },
              left: { xs: 12, md: 20 },
              zIndex: 1,
              // Lifted off the card face so the headline floats above the photo.
              transform: "translateZ(48px)",
            }}
          >
            <Typography
              data-hero-copy
              sx={{
                display: "block",
                fontSize: { xs: 11, md: 14 },
                fontWeight: 600,
                mb: { xs: 0.5, md: 1 },
                color: "common.white",
                letterSpacing: "0.04em",
              }}
            >
              {home.hero.socialProof}
            </Typography>
            <Typography
              data-hero-copy
              component="h1"
              sx={{
                fontSize: "clamp(3rem,11vw,11rem)",
                fontWeight: 800,
                lineHeight: 0.79,
                letterSpacing: "-0.035em",
                color: "common.white",
              }}
            >
              {brand.copy.hero.headline[0]}
              <br />
              {brand.copy.hero.headline[1]}
            </Typography>
          </Box>

          <Typography
            data-hero-copy
            sx={{
              // Hidden below md: the display heading wraps to two lines at
              // narrow widths and would run straight through this.
              display: { xs: "none", md: "block" },
              position: "absolute",
              bottom: 40,
              right: 32,
              zIndex: 1,
              fontSize: 14,
              fontWeight: 600,
              color: "common.white",
              textAlign: "right",
            }}
          >
            {business.address.street}
            <br />
            {business.address.city}, {business.address.state}
          </Typography>
        </MaskedCard>
      </Box>
    </Box>
  );
}
