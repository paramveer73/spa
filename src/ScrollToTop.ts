import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll on navigation — otherwise a new page opens at the previous
 * page's scroll offset. Skipped when the URL carries a #hash, so a link to a
 * section still lands on it.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
