import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ContactSection from "@/components/ContactSection";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import ResultsMarquee from "@/components/ResultsMarquee";
import ServicesSection from "@/components/ServicesSection";
import SplashScreen from "@/components/SplashScreen";
import StorySection from "@/components/StorySection";
import TestimonialsSection from "@/components/TestimonialsSection";
import { ScrollTrigger } from "@/hooks";

/**
 * The public site.
 *
 * The page owns the intro choreography — splash first, then the navbar and
 * hero entrances keyed on `ready` — and the marketing navbar with it. Both are
 * specific to this page: the navbar's links are anchors into these sections,
 * and it's fixed-position, so on the admin and sign-in pages it would sit over
 * their content and point at sections that aren't there.
 */
export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);

  // Stable identity: SplashScreen's timer effect depends on it, and a fresh
  // arrow on every render would restart the countdown.
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  // The splash holds the viewport, so nothing below it has laid out at its
  // final size yet. ScrollTrigger caches start/end positions on creation —
  // refresh once the splash is gone or every pinned section is measured
  // against a scroll height that no longer exists.
  useEffect(() => {
    if (showSplash) return undefined;
    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(id);
  }, [showSplash]);

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary" }}>
      {/* 1. Intro */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Navbar ready={!showSplash} />

      {/* 2. Sections, top to bottom */}
      <HeroSection ready={!showSplash} />

      <StorySection />
      <ResultsMarquee />
      <TestimonialsSection />
      <ContactSection />
    </Box>
  );
}
