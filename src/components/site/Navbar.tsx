import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useGsapContext, gsap } from "@/hooks";
import { scrollToBooking, scrollToSection } from "@/lib/scroll";

const NAV_LINKS = ["Home", "Services", "Results", "About", "Contact"];
const EASE = "cubic-bezier(0.76,0,0.24,1)";

export interface NavbarProps {
  mode: "light" | "dark";
  onToggleMode: () => void;
  phone: string;
  /** Flips true once the splash has torn down, cueing the entrance. */
  ready: boolean;
}

/** Hand-rolled so the icon inherits currentColor and needs no icon package. */
function ModeIcon({ mode }: { mode: "light" | "dark" }) {
  return mode === "light" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="1.8"
          x2="12"
          y2="4.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

export default function Navbar({ mode, onToggleMode, phone, ready }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLElement | null>(null);
  const theme = useTheme();

  /**
   * The bar drops in and its contents stagger up once the splash clears.
   * Keyed on `ready` so it plays against a settled layout rather than
   * competing with the splash for the viewer's attention.
   */
  useGsapContext(
    barRef,
    () => {
      if (!ready) return;
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline.from(barRef.current, { yPercent: -100, duration: 0.7 });

      // Opacity only — deliberately no y offset.
      //
      // These items sit on one horizontal row, and a staggered vertical
      // translate breaks that row while it plays: the button is the last of
      // the four, so it hung 14px low after the wordmark, phone and toggle had
      // already landed. The bar reads as settling and then the CTA drops into
      // it. The bar itself carries all the vertical movement, so the row stays
      // intact the whole way in.
      timeline.from(
        "[data-nav-item]",
        { autoAlpha: 0, duration: 0.5, stagger: 0.07 },
        "-=0.35"
      );
    },
    [ready]
  );

  // Lock the page while the drawer owns the screen.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const bar = alpha(theme.palette.background.default, 0.78);

  return (
    <>
      <Box
        component="header"
        ref={barRef}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          // Grid rather than space-between: the wordmark and the action group
          // have very different heights, and an explicit two-track grid keeps
          // both centred on one row instead of letting the tallest child
          // dictate where everything lands.
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          columnGap: 2,
          // Matched to the sections below (px 1.5/2.5). The header was on 2/3,
          // so the CTA's right edge sat 4px inside the cards beneath it and
          // never lined up with the content.
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1, md: 1.5 },
          bgcolor: bar,
          backdropFilter: "blur(14px)",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {/* 1. Wordmark */}
        <Box data-nav-item sx={{ gridColumn: 1, gridRow: 1, display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            KTLN
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              mt: { xs: -0.4, md: -0.55 },
              color: "primary.main",
            }}
          >
            Studio
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 8, md: 9 },
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "text.secondary",
              mt: { xs: 0.6, md: 0.8 },
            }}
          >
            Clovis, California
          </Typography>
        </Box>

        {/* 2. Desktop actions */}
        <Box sx={{ gridColumn: 2, gridRow: 1, display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
          <Typography data-nav-item sx={{ fontSize: 14, fontWeight: 600 }}>{phone}</Typography>
          <IconButton
            data-nav-item
            onClick={onToggleMode}
            aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
            sx={{ border: 1, borderColor: "divider", color: "text.primary" }}
          >
            <ModeIcon mode={mode} />
          </IconButton>
          <Button
            data-nav-item
            onClick={scrollToBooking}
            variant="outlined"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              px: 3,
              py: 1.35,
              fontSize: 13,
              borderColor: "text.primary",
              color: "text.primary",
              "&:hover": { bgcolor: "text.primary", color: "background.default", borderColor: "text.primary" },
            }}
          >
            Book Appointment
          </Button>
        </Box>

        {/* 3. Mobile controls */}
        <Box sx={{ gridColumn: 2, gridRow: 1, display: { xs: "flex", md: "none" }, alignItems: "center", gap: 0.5 }}>
          <IconButton onClick={onToggleMode} aria-label="Toggle colour mode" sx={{ color: "text.primary" }}>
            <ModeIcon mode={mode} />
          </IconButton>
          <Box
            component="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            sx={{
              width: 40,
              height: 40,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: 0,
              cursor: "pointer",
              p: 0,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  position: "absolute",
                  height: 2,
                  width: 24,
                  borderRadius: 999,
                  bgcolor: "text.primary",
                  transition: `all .3s ${EASE}`,
                  ...(i === 0 && {
                    transform: open ? "rotate(45deg) translateY(0)" : "translateY(-8px)",
                  }),
                  ...(i === 1 && {
                    opacity: open ? 0 : 1,
                    transform: open ? "scaleX(0)" : "scaleX(1)",
                  }),
                  ...(i === 2 && {
                    transform: open ? "rotate(-45deg) translateY(0)" : "translateY(8px)",
                  }),
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* 4. Mobile drawer */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          inset: 0,
          zIndex: 40,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <Box
          onClick={() => setOpen(false)}
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: alpha(theme.palette.common.black, 0.3),
            backdropFilter: "blur(6px)",
            opacity: open ? 1 : 0,
            transition: "opacity .5s ease",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: "85%",
            maxWidth: 380,
            bgcolor: "background.default",
            boxShadow: 24,
            transform: open ? "translateX(0)" : "translateX(100%)",
            transition: `transform .5s ${EASE}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 4,
            gap: 0.5,
          }}
        >
          {NAV_LINKS.map((link, i) => (
            <Typography
              key={link}
              component="a"
              href={`#${link.toLowerCase()}`}
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                setOpen(false);
                scrollToSection(link.toLowerCase());
              }}
              sx={{
                fontSize: "2.25rem",
                fontWeight: 800,
                color: "text.primary",
                textDecoration: "none",
                letterSpacing: "-0.02em",
                opacity: open ? 1 : 0,
                transform: open ? "translateX(0)" : "translateX(32px)",
                transition: `all .5s ${EASE}`,
                transitionDelay: open ? `${100 + i * 60}ms` : "0ms",
                "&:hover": { color: "primary.main" },
              }}
            >
              {link}
            </Typography>
          ))}

          <Box
            sx={{
              mt: 4,
              pt: 4,
              borderTop: 1,
              borderColor: "divider",
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(32px)",
              transition: `all .5s ${EASE}`,
              transitionDelay: open ? "450ms" : "0ms",
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{phone}</Typography>
            <Button
              onClick={() => {
                setOpen(false);
                scrollToBooking();
              }}
              fullWidth
              variant="contained"
              sx={{ py: 1.9, bgcolor: "text.primary", color: "background.default" }}
            >
              Book Appointment
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
