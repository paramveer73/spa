import { useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useGsapContext, gsap } from "@/hooks";
import { PORTRAITS } from "@/lib/images";
import { business, stylist, browMapping, home } from "@/lib/seed";
import { BOOKING_ANCHOR } from "@/lib/scroll";

const SOCIALS = [
  { label: "Instagram", href: business.social.instagram },
  { label: "TikTok", href: business.social.tiktok },
  { label: "Facebook", href: business.social.facebook },
] as const;

export default function ContactSection() {
  const scopeRef = useRef<HTMLElement | null>(null);

  useGsapContext(scopeRef, () => {
    gsap.from("[data-contact-reveal]", {
      yPercent: 22,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: scopeRef.current, start: "top 72%" },
    });
  }, []);

  return (
    <Box
      component="section"
      id="contact"
      ref={scopeRef}
      sx={{ bgcolor: "background.default", px: { xs: 1.5, md: 2.5 }, pb: { xs: 1.5, md: 2.5 } }}
    >
      {/* 1. Booking prompt over portrait */}
      {/* Every "Book" CTA on the page scrolls here — booking is in-house now,
          and this card is where the real flow will mount. */}
      <Box
        id={BOOKING_ANCHOR}
        data-contact-reveal
        sx={{
          position: "relative",
          borderRadius: { xs: 3, md: 4 },
          overflow: "hidden",
          minHeight: { xs: 420, md: 560 },
          display: "flex",
          alignItems: "flex-end",
          scrollMarginTop: "88px",
        }}
      >
        <Box
          component="img"
          src={PORTRAITS.smile}
          alt="KTLN Studio client"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg,rgba(0,0,0,.15) 30%,rgba(0,0,0,.72) 100%)",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1, p: { xs: 3, md: 6 }, width: "100%" }}>
          <Typography
            sx={{
              fontSize: "clamp(1.9rem,5.5vw,4.2rem)",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: "common.white",
              maxWidth: 900,
              textWrap: "balance",
            }}
          >
            {home.cta.headline}
          </Typography>
          <Typography
            sx={{
              mt: { xs: 1.5, md: 2.5 },
              maxWidth: 520,
              fontSize: { xs: 13, md: 16 },
              fontWeight: 500,
              lineHeight: 1.5,
              color: "rgba(255,255,255,.88)",
            }}
          >
            {browMapping.tagline}
          </Typography>

          <Box
            sx={{
              mt: { xs: 3, md: 5 },
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: { xs: 1.5, md: 2 },
            }}
          >
            <Button
              variant="contained"
              sx={{
                px: { xs: 3, md: 5 },
                py: { xs: 1.6, md: 2.2 },
                fontSize: { xs: "0.9rem", md: "1.05rem" },
                fontWeight: 800,
                bgcolor: "common.white",
                color: "common.black",
                "&:hover": { bgcolor: "common.white", transform: "scale(1.04)" },
              }}
            >
              Book {browMapping.price.display} Brow Mapping
            </Button>
            <Button
              href={`tel:${business.phone}`}
              variant="outlined"
              sx={{
                px: { xs: 3, md: 5 },
                py: { xs: 1.6, md: 2.2 },
                fontSize: { xs: "0.9rem", md: "1.05rem" },
                fontWeight: 800,
                color: "common.white",
                borderColor: "rgba(255,255,255,.6)",
                "&:hover": { borderColor: "common.white", bgcolor: "rgba(255,255,255,.1)" },
              }}
            >
              {business.phone}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 2. Studio details */}
      <Box
        data-contact-reveal
        sx={{
          mt: { xs: 0.75, md: 1 },
          borderRadius: { xs: 3, md: 4 },
          bgcolor: "background.paper",
          p: { xs: 3, md: 6 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr" },
          gap: { xs: 4, md: 3 },
          "& > *": { minWidth: 0, overflowWrap: "anywhere" },
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.4rem", md: "1.8rem" }, letterSpacing: "-0.02em" }}>
            KTLN Studio
          </Typography>
          <Typography sx={{ mt: 1.5, color: "text.secondary", maxWidth: 360, fontSize: 14 }}>
            {stylist.role} — {stylist.yearsExperience}+ years shaping soft, natural results in
            {" "}
            {business.serviceArea.join(" and ")}.
          </Typography>
          <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            {SOCIALS.map((social) => (
              <Typography
                key={social.label}
                component="a"
                href={social.href}
                target="_blank"
                rel="noreferrer"
                variant="overline"
                sx={{ color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main" } }}
              >
                {social.label}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            Visit
          </Typography>
          <Typography
            component="a"
            href={business.address.mapUrl}
            target="_blank"
            rel="noreferrer"
            sx={{ display: "block", mt: 1.5, color: "text.secondary", fontSize: 14, textDecoration: "none" }}
          >
            {business.address.street}, {business.address.suite}
            <br />
            {business.address.city}, {business.address.state} {business.address.postalCode}
          </Typography>
        </Box>

        <Box>
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            Contact
          </Typography>
          <Typography
            component="a"
            href={`tel:${business.phone}`}
            sx={{ display: "block", mt: 1.5, color: "text.secondary", fontSize: 14, textDecoration: "none" }}
          >
            {business.phone}
          </Typography>
          <Typography
            component="a"
            href={`mailto:${business.email}`}
            sx={{ display: "block", mt: 0.5, color: "text.secondary", fontSize: 14, textDecoration: "none" }}
          >
            {business.email}
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{ mt: 3, mb: 1, textAlign: "center", color: "text.secondary", fontSize: 12 }}
      >
        © {new Date().getFullYear()} KTLN Studio. All rights reserved.
      </Typography>
    </Box>
  );
}
