import { useRef, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useGsapContext, gsap } from "@/hooks";
import { GALLERY, PORTRAITS, brand, browMapping, services, stylist } from "@/data";
import { BRAND } from "@/theme";
import { useFirebase } from "@/firebase";
import { ROUTES } from "@/Routes";

/**
 * Boxes drawn over the portrait, in percentages of the photo frame, each
 * naming the treatment that area gets. Tuned by eye to PORTRAITS.brows —
 * re-check them if that photo is ever swapped.
 */
const SCAN_BOXES = [
  { top: "29.5%", left: "36%", width: "38%", height: "12%" },
  { top: "39%", left: "13%", width: "33%", height: "12.5%" },
  { top: "64%", left: "43%", width: "31%", height: "11.5%" },
] as const;

/**
 * Softens the photo into the page. The studio's only front-facing portrait is
 * shot against a dark wall, so its frame edges have to dissolve rather than
 * sit as a rectangle — a cutout PNG would need no more than this too.
 */
const FEATHER = "radial-gradient(ellipse 64% 64% at 50% 42%, #000 32%, rgba(0,0,0,0) 86%)";

/** Faces for the trust badge, from the studio's own client photography. */
const TRUST_FACES = [GALLERY[2], GALLERY[3], GALLERY[6]];

export interface HeroSectionProps {
  /** Splash has torn down — safe to play the entrance against final layout. */
  ready: boolean;
}

/**
 * Three layers across the fold: the claim on the left, the work in the middle,
 * the numbers on the right. The portrait carries labelled boxes over the areas
 * each treatment addresses, so the services are legible before a word is read.
 */
export default function HeroSection({ ready }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const firebase = useFirebase();

  const stats = [
    { value: `${stylist.yearsExperience}+`, label: "years of precision artistry", Icon: LatticeMark },
    { value: `${services.length}`, label: "treatments in studio", Icon: RingsMark },
    { value: browMapping.price.display ?? "", label: "brow mapping session", Icon: DiscMark },
  ];

  useGsapContext(
    sectionRef,
    () => {
      if (!ready) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-portrait]", { autoAlpha: 0, scale: 1.04, duration: 1.2 }, 0)
        .from("[data-hero-left]", { x: -28, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 0.2)
        .from("[data-hero-stat]", { x: 28, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, 0.35)
        // Boxes land last, one after another, the way a scan reports findings.
        .from("[data-hero-box]", { autoAlpha: 0, scale: 0.92, duration: 0.5, stagger: 0.16 }, 0.7);
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
        overflow: "hidden",
        bgcolor: "background.default",
        pt: { xs: 11, md: 12 },
        px: { xs: 2.5, md: 5 },
        pb: { xs: 4, md: 5 },
      }}
    >
      {/* 1. One soft pool of light, so the portrait doesn't float on flat white */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "8%",
          left: "50%",
          width: "min(1100px, 120vw)",
          height: "min(1100px, 120vw)",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(BRAND.accentSoft, 0.28)} 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 1fr) minmax(0, 1.25fr) minmax(190px, 0.62fr)" },
          alignItems: "stretch",
          gap: { xs: 3, md: 2 },
        }}
      >
        {/* 2. Claim — badge at the top, headline sitting on the fold */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            order: { xs: 1, md: 0 },
          }}
        >
          <Box
            data-hero-left
            sx={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              pl: 0.75,
              pr: 2,
              py: 0.75,
              borderRadius: 999,
              border: 1,
              borderColor: "divider",
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.75),
              backdropFilter: "blur(6px)",
            }}
          >
            <Box sx={{ display: "flex" }}>
              {TRUST_FACES.map((face, index) => (
                <Box
                  key={face.src}
                  component="img"
                  src={face.src}
                  alt=""
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: 2,
                    borderColor: "background.paper",
                    ml: index === 0 ? 0 : "-9px",
                  }}
                />
              ))}
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
              {brand.copy.hero.trustBadge}
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 560 }}>
            <Typography
              data-hero-left
              component="h1"
              sx={{
                fontSize: "clamp(2.5rem, 6.2vw, 5.4rem)",
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: "-0.035em",
                color: "text.primary",
              }}
            >
              {brand.copy.hero.headline.map((line) => (
                <Box component="span" key={line} sx={{ display: "block" }}>
                  {line}
                </Box>
              ))}
            </Typography>

            {/* The line the studio wants read: what they're known for, and where. */}
            <Typography
              data-hero-left
              component="p"
              sx={{ mt: { xs: 2, md: 3 }, maxWidth: 320, fontSize: { xs: 15, md: 17 }, color: "text.secondary" }}
            >
              {brand.copy.hero.secondary}
            </Typography>

            <Button
              data-hero-left
              component={RouterLink}
              to={ROUTES.BOOK}
              onClick={() => firebase?.logBookNowClick("hero")}
              variant="contained"
              sx={{
                mt: { xs: 3, md: 4 },
                px: 4,
                py: 1.8,
                borderRadius: 3,
                fontSize: "1rem",
                bgcolor: (theme) => alpha(BRAND.accentSoft, theme.palette.mode === "light" ? 0.45 : 0.9),
                color: "text.primary",
                "&:hover": {
                  bgcolor: (theme) => alpha(BRAND.accentSoft, theme.palette.mode === "light" ? 0.7 : 1),
                  transform: "translateY(-2px)",
                },
              }}
            >
              {brand.copy.bookingCta}
            </Button>
          </Box>
        </Box>

        {/* 3. The work itself, labelled */}
        <Box
          data-hero-portrait
          sx={{
            position: "relative",
            order: { xs: 0, md: 0 },
            // Stacked layouts get a portrait-shaped frame: a short, wide one
            // crops to the forehead and leaves the labelled boxes pointing at
            // nothing. On md+ the column's own height sets the shape.
            aspectRatio: { xs: "3 / 4", md: "auto" },
            // Runs past the section's bottom padding, so the subject meets the fold.
            mb: { md: -5 },
            mx: { md: -4 },
          }}
        >
          <Box
            component="img"
            src={PORTRAITS.brows}
            alt={`Brow work at ${brand.name}`}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 18%",
              // The feather washes the subject out a little; this puts the
              // contrast back without touching the source photo.
              filter: "contrast(1.07) saturate(1.03)",
              maskImage: FEATHER,
              WebkitMaskImage: FEATHER,
            }}
          />

          {SCAN_BOXES.map((box, index) => (
            <Box
              key={brand.copy.hero.scanLabels[index]}
              data-hero-box
              sx={{
                position: "absolute",
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                border: "1px solid rgba(255,255,255,.92)",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,.45))",
                pointerEvents: "none",
              }}
            >
              {/* Corner handle, as on a focus reticle. */}
              <Box
                sx={{
                  position: "absolute",
                  top: 5,
                  left: 5,
                  width: 6,
                  height: 6,
                  bgcolor: "common.white",
                }}
              />
              <Typography
                sx={{
                  position: "absolute",
                  left: 6,
                  bottom: 5,
                  maxWidth: "94%",
                  fontSize: { xs: 10, md: 12 },
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: "common.white",
                  textShadow: "0 1px 10px rgba(0,0,0,.6)",
                }}
              >
                {brand.copy.hero.scanLabels[index]}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 4. Numbers */}
        <Box
          sx={{
            order: { xs: 2, md: 0 },
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            justifyContent: "center",
            gap: { xs: 2, md: 5 },
          }}
        >
          {stats.map(({ value, label, Icon }) => (
            <Box
              key={label}
              data-hero-stat
              sx={{
                flex: { xs: 1, md: "none" },
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, md: 2 },
                justifyContent: { md: "flex-end" },
                textAlign: { xs: "center", md: "right" },
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              <Icon />
              <Box>
                <Typography sx={{ fontSize: { xs: "1.5rem", md: "2.4rem" }, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {value}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: { xs: 11, md: 13 }, color: "text.secondary", maxWidth: 130 }}>
                  {label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* Wireframe marks beside each number — drawn inline so the hero pulls in no
   icon package, and so they inherit the text colour in both palettes. */

function MarkFrame({ children }: { children: ReactNode }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: { xs: 28, md: 44 },
        height: { xs: 28, md: 44 },
        flexShrink: 0,
        color: "text.disabled",
        opacity: 0.85,
      }}
    >
      <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
        {children}
      </svg>
    </Box>
  );
}

function LatticeMark() {
  return (
    <MarkFrame>
      <path d="M22 6 36 14v16L22 38 8 30V14L22 6Z" />
      <path d="M22 6v32M8 14l28 16M36 14 8 30" />
      <circle cx="22" cy="22" r="2.5" fill="currentColor" stroke="none" />
    </MarkFrame>
  );
}

function RingsMark() {
  return (
    <MarkFrame>
      <ellipse cx="22" cy="17" rx="12" ry="7" />
      <ellipse cx="22" cy="27" rx="12" ry="7" />
      <ellipse cx="22" cy="22" rx="7" ry="12" />
    </MarkFrame>
  );
}

function DiscMark() {
  return (
    <MarkFrame>
      <ellipse cx="22" cy="15" rx="13" ry="6.5" />
      <path d="M9 15v14c0 3.6 5.8 6.5 13 6.5s13-2.9 13-6.5V15" />
      <path d="M22 8.5v27M9 22c4 2.6 8.4 3.6 13 3.6s9-1 13-3.6" />
    </MarkFrame>
  );
}
