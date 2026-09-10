import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import buildTheme from "@/theme";
import { ScrollTrigger } from "@/hooks";
import {
  ContactSection,
  HeroSection,
  Navbar,
  ResultsMarquee,
  ServicesSection,
  SplashScreen,
  StorySection,
  TestimonialsSection,
} from "@/components/site";
import { business } from "@/lib/seed";

const STORAGE_KEY = "ktln-color-mode";

type Mode = "light" | "dark";

/** Remembered choice first, then the OS preference. */
function initialMode(): Mode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private browsing can throw on access — fall through to the media query.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showSplash, setShowSplash] = useState(true);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Persisting is a convenience; never let it break the toggle.
      }
      return next;
    });
  }, []);

  // The splash holds the viewport, so nothing below it has laid out at its
  // final size yet. ScrollTrigger caches start/end positions on creation —
  // refresh once the splash is gone or every pinned section is measured
  // against a scroll height that no longer exists.
  useEffect(() => {
    if (showSplash) return;
    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(id);
  }, [showSplash]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: "background.default", color: "text.primary" }}>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

        <Navbar mode={mode} onToggleMode={toggleMode} phone={business.phone} ready={!showSplash} />

        <HeroSection ready={!showSplash} />
        <ServicesSection />
        <StorySection />
        <ResultsMarquee />
        <TestimonialsSection />
        <ContactSection />
      </Box>
    </ThemeProvider>
  );
}
