import { useEffect, useState } from "react";

const QUERY = "(max-width: 767px)";

/**
 * Single breakpoint for the whole site, matching MUI's `md`. Read as a value
 * rather than a CSS media query because the masked-card focal points are
 * numbers passed to JS, not classes.
 */
export default function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
