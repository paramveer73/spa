import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useGsapContext, gsap } from "@/hooks";
import { PORTRAITS } from "@/lib/images";
import { stylist, home } from "@/lib/seed";

/**
 * The narrative beat of the page: the section pins, and the viewer scrolls
 * *through* the story rather than past it. Each chapter cross-fades while its
 * portrait scales down, so the scroll distance maps to story progress.
 */
const CHAPTERS = [
  { image: PORTRAITS.brows, kicker: "01 — The Craft", body: home.about.body[0] },
  { image: PORTRAITS.lashes, kicker: "02 — The Experience", body: home.about.body[1] },
  { image: PORTRAITS.studio, kicker: "03 — The Artist", body: stylist.bio },
];

export default function StorySection() {
  const scopeRef = useRef<HTMLElement | null>(null);

  useGsapContext(scopeRef, () => {
    const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]");
    const headline = scopeRef.current?.querySelector("[data-story-headline]");

    // Pin the section and scrub one chapter per viewport-height of scroll.
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scopeRef.current,
        start: "top top",
        end: () => `+=${chapters.length * 100}%`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
      },
    });

    chapters.forEach((chapter, i) => {
      const image = chapter.querySelector("[data-chapter-image]");
      const copy = chapter.querySelectorAll("[data-chapter-copy]");

      if (i > 0) {
        timeline.fromTo(
          chapter,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5, ease: "power2.inOut" },
          i
        );
        timeline.fromTo(
          copy,
          { yPercent: 40, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" },
          i
        );
      }

      // Slow drift on the portrait keeps the frame alive while pinned.
      timeline.fromTo(
        image,
        { scale: 1.18 },
        { scale: 1, duration: 1, ease: "none" },
        i
      );

      if (i < chapters.length - 1) {
        timeline.to(chapter, { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" }, i + 0.6);
      }
    });

    // Headline tracks the whole pinned journey.
    if (headline) {
      timeline.fromTo(
        headline,
        { letterSpacing: "-0.04em", opacity: 0.35 },
        { letterSpacing: "0.02em", opacity: 1, duration: chapters.length, ease: "none" },
        0
      );
    }
  }, []);

  return (
    <Box
      component="section"
      id="about"
      ref={scopeRef}
      sx={{
        position: "relative",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        bgcolor: "background.paper",
        px: { xs: 1.5, md: 2.5 },
        py: { xs: 0.75, md: 1 },
      }}
    >
      <Typography
        data-story-headline
        sx={{
          position: "absolute",
          top: { xs: 24, md: 40 },
          left: { xs: 24, md: 44 },
          zIndex: 3,
          fontSize: { xs: 11, md: 13 },
          fontWeight: 700,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Precision you can trust
      </Typography>

      {CHAPTERS.map((chapter, i) => (
        <Box
          key={chapter.kicker}
          data-chapter
          sx={{
            position: "absolute",
            inset: { xs: 12, md: 20 },
            borderRadius: { xs: 3, md: 4 },
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            // Only the first chapter is visible before GSAP takes over, so the
            // section reads correctly with JS still loading.
            opacity: i === 0 ? 1 : 0,
            visibility: i === 0 ? "visible" : "hidden",
          }}
        >
          <Box
            sx={{
              position: "relative",
              order: { xs: 0, md: i % 2 === 0 ? 0 : 1 },
              overflow: "hidden",
              minHeight: { xs: "42dvh", md: "auto" },
            }}
          >
            <Box
              component="img"
              data-chapter-image
              src={chapter.image}
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Box>

          <Box
            sx={{
              bgcolor: "background.default",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: { xs: 1.5, md: 3 },
              p: { xs: 3, md: 8 },
            }}
          >
            <Typography
              data-chapter-copy
              variant="overline"
              sx={{ color: "primary.main", fontSize: { xs: 10, md: 12 } }}
            >
              {chapter.kicker}
            </Typography>
            <Typography
              data-chapter-copy
              sx={{
                fontSize: { xs: "0.92rem", md: "1.35rem" },
                lineHeight: 1.55,
                fontWeight: 500,
                color: "text.primary",
              }}
            >
              {chapter.body}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
