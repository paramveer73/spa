import { useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import MaskedCard from "./MaskedCard";
import { useImageWidth, useIsMobile, useMaskPositions, useStaggeredReveal } from "@/hooks";
import { BACKDROPS } from "@/lib/images";
import { featuredServices, home } from "@/lib/seed";
import { scrollToBooking } from "@/lib/scroll";

const CARD_COUNT = 4;
const FOCAL = { mobile: 0.65, desktop: 0.8 };

const CTA_LABEL = "Book now";
const BADGE_SIZE = { xs: 30, md: 44 };
/** Wide enough for CTA_LABEL plus the arrow without the text wrapping. */
const BADGE_OPEN_WIDTH = { xs: 96, md: 132 };
const EASE_OUT = "cubic-bezier(0.16,1,0.3,1)";

/** Hand-rolled so it inherits currentColor and pulls in no icon package. */
function BookArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 7h11m0 0L8 3m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const isMobile = useIsMobile();

  const positions = useMaskPositions(sectionRef, cardsRef, CARD_COUNT);
  const imageWidth = useImageWidth(BACKDROPS.services, positions[0]?.sh ?? 0);
  const reveal = useStaggeredReveal(CARD_COUNT);
  const focalX = isMobile ? FOCAL.mobile : FOCAL.desktop;

  const setRefs = (index: number) => (node: HTMLElement | null) => {
    cardsRef.current[index] = node;
  };

  return (
    <Box
      component="section"
      id="services"
      ref={(node: HTMLElement | null) => {
        sectionRef.current = node;
        reveal.containerRef.current = node;
      }}
      sx={{
        minHeight: { xs: "100dvh", md: "auto" },
        height: { md: "100dvh" },
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pt: { xs: 0.75, md: 1 },
        px: { xs: 1.5, md: 2.5 },
        pb: { xs: 0.75, md: 1 },
        gap: { xs: 0.75, md: 1 },
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gridTemplateRows: { xs: "auto auto auto auto", md: "1fr 1fr 0.85fr" },
          gap: { xs: 0.75, md: 1 },
        }}
      >
        {/* 0. Section title */}
        <MaskedCard
          cardRef={setRefs(0)}
          bgImage={BACKDROPS.services}
          position={positions[0]}
          imageWidth={imageWidth}
          focalX={focalX}
          style={reveal.getAnimStyle(0)}
          sx={{ minHeight: { xs: 170, md: 0 } }}
        >
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,.32)" }} />
          <Typography
            sx={{
              position: "absolute",
              top: { xs: 16, md: 26 },
              left: { xs: 20, md: 28 },
              zIndex: 1,
              fontSize: { xs: "1.6rem", md: "2.1rem" },
              fontWeight: 800,
              color: "common.white",
              letterSpacing: "-0.02em",
            }}
          >
            Our Services
            <br />& Pricing
          </Typography>
          <Typography
            sx={{
              position: "absolute",
              bottom: { xs: 16, md: 26 },
              left: { xs: 20, md: 28 },
              right: { xs: 20, md: 28 },
              zIndex: 1,
              fontSize: { xs: 11, md: 13 },
              fontWeight: 600,
              color: "common.white",
            }}
          >
            {home.servicesIntro}
          </Typography>
        </MaskedCard>

        {/* 1. Tall call-to-action card */}
        <MaskedCard
          cardRef={setRefs(1)}
          bgImage={BACKDROPS.services}
          position={positions[1]}
          imageWidth={imageWidth}
          focalX={focalX}
          style={reveal.getAnimStyle(1)}
          sx={{ gridRow: { md: "span 2" }, minHeight: { xs: 210, md: 0 } }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg,rgba(0,0,0,.15) 40%,rgba(0,0,0,.6) 100%)",
            }}
          />
          <Typography
            sx={{
              position: "absolute",
              bottom: { xs: 68, md: 88 },
              left: { xs: 20, md: 28 },
              right: { xs: 20, md: 120 },
              zIndex: 1,
              fontSize: { xs: 11, md: 14 },
              fontWeight: 600,
              lineHeight: 1.4,
              color: "common.white",
            }}
          >
            {home.cta.body}
          </Typography>
          <Button
            onClick={scrollToBooking}
            variant="contained"
            sx={{
              position: "absolute",
              bottom: { xs: 16, md: 24 },
              right: { xs: 16, md: 24 },
              zIndex: 1,
              px: { xs: 2.5, md: 4 },
              py: { xs: 1.4, md: 2.2 },
              fontSize: { xs: "0.9rem", md: "1.15rem" },
              fontWeight: 800,
              bgcolor: "common.white",
              color: "common.black",
              "&:hover": { bgcolor: "common.white", transform: "scale(1.05)" },
            }}
          >
            Book Now
          </Button>
        </MaskedCard>

        {/* 2. Editorial statement */}
        <MaskedCard
          cardRef={setRefs(2)}
          bgImage={BACKDROPS.services}
          position={positions[2]}
          imageWidth={imageWidth}
          focalX={focalX}
          style={reveal.getAnimStyle(2)}
          sx={{ minHeight: { xs: 170, md: 0 } }}
        >
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,.35)" }} />
          <Typography
            sx={{
              position: "absolute",
              top: { xs: 16, md: 26 },
              left: { xs: 20, md: 28 },
              right: { xs: 16, md: 20 },
              zIndex: 1,
              fontSize: "clamp(2.4rem,6vw,5rem)",
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: "common.white",
            }}
          >
            Real Results.
            <br />
            Real Confidence.
          </Typography>
        </MaskedCard>

        {/* 3. The four headline treatments */}
        <MaskedCard
          cardRef={setRefs(3)}
          bgImage={BACKDROPS.services}
          position={positions[3]}
          imageWidth={imageWidth}
          focalX={focalX}
          style={reveal.getAnimStyle(3)}
          sx={{ gridColumn: { xs: "span 1", md: "span 2" }, minHeight: { xs: 210, md: 0 } }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              display: "flex",
              flexWrap: { xs: "wrap", md: "nowrap" },
              gap: { xs: 0.75, md: 1 },
              p: { xs: 1, md: 1.5 },
            }}
          >
            {featuredServices.map((svc, i) => {
              const active = i === 0;
              return (
                <Box
                  key={svc.id}
                  component="button"
                  type="button"
                  onClick={scrollToBooking}
                  aria-label={`${CTA_LABEL} — ${svc.name}`}
                  sx={{
                    flex: 1,
                    minWidth: { xs: "calc(50% - 4px)", md: 0 },
                    borderRadius: { xs: 3, md: 4 },
                    p: { xs: 1.5, md: 2.5 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    // A real <button>: the whole card is the booking target, so
                    // it needs keyboard focus and Enter/Space for free rather
                    // than a div with a click handler bolted on.
                    border: 0,
                    font: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                    appearance: "none",
                    // All four cards are the same palette surface — the active
                    // one is simply opaque while the rest are a veil over the
                    // photograph. Keeping them one material is what lets every
                    // card use text.primary and still stay legible: the text
                    // contrasts against the veil, never against the photo.
                    //
                    // 0.62 is the floor that holds up over the lightest part of
                    // the current backdrop; much thinner and the image starts
                    // bleeding through into the type.
                    bgcolor: (theme) =>
                      active
                        ? theme.palette.background.paper
                        : alpha(theme.palette.background.paper, 0.62),
                    backdropFilter: active ? "blur(12px)" : "blur(20px)",
                    transition: "background-color .3s ease, transform .3s ease",
                    // The badge is driven from the card rather than from its own
                    // :hover — the invitation should fire anywhere on the card,
                    // not only when the pointer happens to land on the circle.
                    // Focus-visible mirrors it so keyboard users get the same cue.
                    "&:hover, &:focus-visible": { transform: "translateY(-4px)" },
                    // width reads a custom property rather than a breakpoint
                    // object: MUI resolves responsive objects against the theme
                    // only for top-level sx keys, and silently drops them inside
                    // a nested descendant selector like this one. The variable is
                    // declared on the badge itself, where breakpoints do work.
                    "&:hover .service-badge, &:focus-visible .service-badge": {
                      width: "var(--badge-open-width)",
                      bgcolor: "text.primary",
                      color: "background.paper",
                    },
                    "&:hover .service-badge__num, &:focus-visible .service-badge__num": {
                      opacity: 0,
                    },
                    "&:hover .service-badge__cta, &:focus-visible .service-badge__cta": {
                      opacity: 1,
                    },
                  }}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: { xs: "1.05rem", md: "2rem" },
                      fontWeight: 800,
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                      color: "text.primary",
                    }}
                  >
                    {svc.name}
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.5,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: 11, md: 14 },
                        fontWeight: 700,
                        color: "text.primary",
                        opacity: 0.9,
                      }}
                    >
                      {svc.price.display ? `${svc.price.qualifier ?? "From"} ${svc.price.display}` : "Enquire"}
                    </Typography>
                    {/* Index badge that opens into the booking invitation on
                        hover. Both states are absolutely positioned so the pill
                        can animate its width without the label reflowing — a
                        flex swap would jitter as the text re-centres each frame.
                        borderRadius stays 999 rather than 50% so the circle and
                        the pill are the same shape at every width. */}
                    <Box
                      className="service-badge"
                      sx={{
                        position: "relative",
                        "--badge-open-width": {
                          xs: `${BADGE_OPEN_WIDTH.xs}px`,
                          md: `${BADGE_OPEN_WIDTH.md}px`,
                        },
                        width: BADGE_SIZE,
                        height: BADGE_SIZE,
                        borderRadius: 999,
                        border: 1,
                        borderColor: "text.primary",
                        color: "text.primary",
                        flexShrink: 0,
                        overflow: "hidden",
                        transition: `width .42s ${EASE_OUT}, background-color .3s ease, color .3s ease`,
                      }}
                    >
                      <Box
                        className="service-badge__num"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: { xs: 10, md: 13 },
                          fontWeight: 700,
                          transition: "opacity .18s ease",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </Box>

                      <Box
                        className="service-badge__cta"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.75,
                          whiteSpace: "nowrap",
                          fontSize: { xs: 9, md: 11 },
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          opacity: 0,
                          // Delayed so the pill has started widening before the
                          // label appears, instead of the text popping in first.
                          transition: "opacity .22s ease .1s",
                        }}
                      >
                        {CTA_LABEL}
                        <BookArrow />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </MaskedCard>
      </Box>
    </Box>
  );
}
