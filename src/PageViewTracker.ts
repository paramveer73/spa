import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useFirebase } from "@/firebase";
import { ROUTES } from "@/Routes";

/** ROUTES inverted ("/admin/bookings" → "ADMIN_BOOKINGS"), so each page view carries the page's name. */
const PAGE_NAMES = new Map<string, string>(Object.entries(ROUTES).map(([name, path]) => [path, name]));

/**
 * Logs a page view whenever the route changes — client-side navigation never
 * reloads the page, so GA's automatic page_view would only ever see the first.
 */
export default function PageViewTracker() {
  const { pathname } = useLocation();
  const firebase = useFirebase();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    const pageName = PAGE_NAMES.get(path);
    // Paths outside ROUTES are skipped: App redirects them to a real page,
    // which is logged in turn. The ref stops StrictMode's double effect run
    // (and #hash-only changes) from logging the same page twice.
    if (!firebase || !pageName || lastPath.current === path) return;
    lastPath.current = path;
    firebase.logPageView(pageName, path);
  }, [pathname, firebase]);

  return null;
}
