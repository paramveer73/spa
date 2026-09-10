import { useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MaskedCard from "./MaskedCard";
import { useImageWidth, useIsMobile, useMaskPositions, useStaggeredReveal } from "@/hooks";
import { BACKDROPS } from "@/lib/images";
import { featuredServices, home } from "@/lib/seed";
import { scrollToBooking } from "@/lib/scroll";

const CARD_COUNT = 4;
const FOCAL = { mobile: 0.65, desktop: 0.8 };

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
                  sx={{
                    flex: 1,
                    minWidth: { xs: "calc(50% - 4px)", md: 0 },
                    borderRadius: { xs: 3, md: 4 },
                    p: { xs: 1.5, md: 2.5 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    bgcolor: active ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.16)",
                    backdropFilter: active ? "blur(12px)" : "blur(20px)",
                    transition: "background-color .3s ease, transform .3s ease",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: { xs: "1.05rem", md: "2rem" },
                      fontWeight: 800,
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                      color: active ? "common.black" : "common.white",
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
                        color: active ? "common.black" : "common.white",
                        opacity: 0.9,
                      }}
                    >
                      {svc.price.display ? `${svc.price.qualifier ?? "From"} ${svc.price.display}` : "Enquire"}
                    </Typography>
                    <Box
                      sx={{
                        width: { xs: 30, md: 44 },
                        height: { xs: 30, md: 44 },
                        borderRadius: "50%",
                        border: 1,
                        borderColor: active ? "common.black" : "common.white",
                        color: active ? "common.black" : "common.white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: { xs: 10, md: 13 },
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
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
