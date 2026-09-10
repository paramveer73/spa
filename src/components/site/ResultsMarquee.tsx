import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useGsapContext, gsap } from "@/hooks";
import { GALLERY } from "@/lib/images";
import { home } from "@/lib/seed";

/**
 * Horizontal scrub: vertical scroll drives the gallery sideways while the
 * section is pinned. The track is translated by its own overflow width, so it
 * always ends flush regardless of viewport size or how many images the studio
 * adds later.
 */
export default function ResultsMarquee() {
  const scopeRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useGsapContext(scopeRef, () => {
    const track = trackRef.current;
    if (!track) return;

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);

    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: scopeRef.current,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  }, []);

  return (
    <Box
      component="section"
      id="results"
      ref={scopeRef}
      sx={{
        position: "relative",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ px: { xs: 3, md: 6 } }}>
        <Typography variant="overline" sx={{ color: "primary.main" }}>
          The Work
        </Typography>
        <Typography
          sx={{
            fontSize: "clamp(2.2rem,6vw,4.5rem)",
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            mt: 1,
          }}
        >
          Real Results.
        </Typography>
        <Typography sx={{ mt: 1.5, color: "text.secondary", maxWidth: 460, fontSize: { xs: 13, md: 15 } }}>
          {home.resultsIntro}
        </Typography>
      </Box>

      <Box
        ref={trackRef}
        sx={{
          display: "flex",
          gap: { xs: 1.5, md: 2.5 },
          pl: { xs: 3, md: 6 },
          pr: 6,
          width: "max-content",
          willChange: "transform",
        }}
      >
        {GALLERY.map((image, i) => (
          <Box
            key={image.src}
            sx={{
              position: "relative",
              width: { xs: 220, md: 340 },
              height: { xs: 280, md: 440 },
              borderRadius: { xs: 3, md: 4 },
              overflow: "hidden",
              flexShrink: 0,
              // Alternating offset keeps the strip from reading as a flat row.
              mt: i % 2 === 1 ? { xs: 3, md: 6 } : 0,
            }}
          >
            <Box
              component="img"
              src={image.src}
              alt={image.alt}
              loading="lazy"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform .6s cubic-bezier(0.16,1,0.3,1)",
                "&:hover": { transform: "scale(1.06)" },
              }}
            />
            <Typography
              sx={{
                position: "absolute",
                left: 14,
                bottom: 12,
                fontSize: 11,
                fontWeight: 700,
                color: "common.white",
                textShadow: "0 1px 12px rgba(0,0,0,.6)",
              }}
            >
              {image.alt}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
