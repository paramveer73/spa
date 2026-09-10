import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useGsapContext, gsap } from "@/hooks";
import { testimonials, home } from "@/lib/seed";

export default function TestimonialsSection() {
  const scopeRef = useRef<HTMLElement | null>(null);

  useGsapContext(scopeRef, () => {
    gsap.from("[data-quote]", {
      yPercent: 18,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.14,
      ease: "power3.out",
      scrollTrigger: { trigger: scopeRef.current, start: "top 70%" },
    });
  }, []);

  return (
    <Box
      component="section"
      ref={scopeRef}
      sx={{
        bgcolor: "background.paper",
        px: { xs: 3, md: 6 },
        py: { xs: 8, md: 14 },
      }}
    >
      <Box sx={{ maxWidth: 640, mb: { xs: 4, md: 7 } }}>
        <Typography variant="overline" sx={{ color: "primary.main" }}>
          Client Reviews
        </Typography>
        <Typography
          sx={{
            fontSize: "clamp(2rem,5vw,3.6rem)",
            fontWeight: 800,
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            mt: 1,
          }}
        >
          {home.hero.socialProof}
        </Typography>
        <Typography sx={{ mt: 2, color: "text.secondary", fontSize: { xs: 13, md: 15 } }}>
          {home.reviewsIntro}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" },
          gap: { xs: 1.5, md: 2.5 },
        }}
      >
        {testimonials.map((item) => (
          <Box
            key={item.author}
            data-quote
            sx={{
              bgcolor: "background.default",
              borderRadius: { xs: 3, md: 4 },
              p: { xs: 3, md: 4 },
              border: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 3,
              transition: "transform .4s cubic-bezier(0.16,1,0.3,1)",
              "&:hover": { transform: "translateY(-6px)" },
            }}
          >
            <Typography
              sx={{ fontSize: { xs: "1rem", md: "1.12rem" }, lineHeight: 1.5, fontWeight: 500 }}
            >
              {item.quote}
            </Typography>
            <Typography variant="overline" sx={{ color: "primary.main" }}>
              {item.author}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
