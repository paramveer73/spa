import { useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Wordmark from "@/components/Wordmark";
import { useGsapContext, gsap } from "@/hooks";
import { BOOKING_ANCHOR } from "@/utils/scroll";
import { useFirebase } from "@/firebase";
import { ROUTES } from "@/Routes";
import { PORTRAITS, brand, business, fillTemplate, stylist, browMapping, home } from "@/data";
import { BRAND } from "@/theme";

const SOCIALS = [
  { label: "Instagram", href: business.social.instagram },
  { label: "TikTok", href: business.social.tiktok },
  { label: "Facebook", href: business.social.facebook },
] as const;

export default function ContactSection() {
  const scopeRef = useRef<HTMLElement | null>(null);
  const firebase = useFirebase();

  /**
   * fromTo, not from: a bare `from` left the first block parked at its start
   * offset (+22%) whenever the tween was re-created — React's double-invoked
   * effects are enough to do it — and the details panel then rode up over the
   * booking card. Explicit end values plus clearProps mean the worst case is
   * no animation rather than a broken layout.
   */
  useGsapContext(scopeRef, () => {
    gsap.fromTo(
      "[data-contact-reveal]",
      { yPercent: 22, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "transform,visibility,opacity",
        scrollTrigger: { trigger: scopeRef.current, start: "top 72%" },
      }
    );
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
          transition: "box-shadow .45s ease, transform .45s ease",
          "&:hover": {
            boxShadow: `0 30px 70px ${alpha(BRAND.brownDeep, 0.32)}`,
            transform: "translateY(-4px)",
          },
          "&:hover img": { transform: "scale(1.03)" },
        }}
      >
        <Box
          component="img"
          src={PORTRAITS.smile}
          alt={`${brand.name} client`}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform .6s cubic-bezier(0.16,1,0.3,1)",
          }}
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
              component={RouterLink}
              to={ROUTES.BOOK}
              onClick={() => firebase?.logBookNowClick("contact")}
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
          // Warm wash across the panel — a flat fill made this block read as a
          // leftover strip under the photo rather than part of the page.
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(BRAND.sand, theme.palette.mode === "light" ? 0.95 : 0.14)} 0%, ${
              theme.palette.background.paper
            } 52%, ${alpha(BRAND.accentSoft, theme.palette.mode === "light" ? 0.4 : 0.16)} 100%)`,
          border: 1,
          borderColor: "divider",
          p: { xs: 3, md: 6 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr" },
          gap: { xs: 4, md: 3 },
          "& > *": { minWidth: 0, overflowWrap: "anywhere" },
        }}
      >
        <Box>
          <Wordmark size="lg" showLocation={false} />
          <Typography sx={{ mt: 1.5, color: "text.secondary", maxWidth: 360, fontSize: 14 }}>
            {fillTemplate(brand.copy.contact.blurb, {
              role: stylist.role,
              years: stylist.yearsExperience,
              areas: business.serviceArea.join(" and "),
            })}
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
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  transition: "color .25s ease",
                  "&:hover": { color: "primary.main", textDecoration: "underline", textUnderlineOffset: 5 },
                }}
              >
                {social.label}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            {brand.copy.contact.visitLabel}
          </Typography>
          <Typography
            component="a"
            href={business.address.mapUrl}
            target="_blank"
            rel="noreferrer"
            sx={{
              display: "block",
              mt: 1.5,
              color: "text.secondary",
              fontSize: 14,
              textDecoration: "none",
              transition: "color .25s ease",
              "&:hover": { color: "primary.main" },
            }}
          >
            {business.address.street}, {business.address.suite}
            <br />
            {business.address.city}, {business.address.state} {business.address.postalCode}
          </Typography>
        </Box>

        <Box>
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            {brand.copy.contact.contactLabel}
          </Typography>
          <Typography
            component="a"
            href={`tel:${business.phone}`}
            sx={{
              display: "block",
              mt: 1.5,
              color: "text.secondary",
              fontSize: 14,
              textDecoration: "none",
              transition: "color .25s ease",
              "&:hover": { color: "primary.main" },
            }}
          >
            {business.phone}
          </Typography>
          <Typography
            component="a"
            href={`mailto:${business.email}`}
            sx={{
              display: "block",
              mt: 0.5,
              color: "text.secondary",
              fontSize: 14,
              textDecoration: "none",
              transition: "color .25s ease",
              "&:hover": { color: "primary.main" },
            }}
          >
            {business.email}
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{ mt: 3, mb: 1, textAlign: "center", color: "text.secondary", fontSize: 12 }}
      >
        © {new Date().getFullYear()} {brand.name}. {brand.copy.contact.rightsNotice}
      </Typography>
    </Box>
  );
}
