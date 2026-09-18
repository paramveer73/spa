import { ROUTES } from "@/Routes";

/**
 * Where to go after signing in, carried as `?next=` on the sign-in URL. A
 * query parameter rather than router state because the email-link sign-in
 * finishes on a fresh page load — possibly on another device — where router
 * state no longer exists but the URL does.
 */

const NEXT_PARAM = "next";

/** The sign-in page, set to return to `next` afterwards. */
export function signInPathFor(next: string): string {
  return `${ROUTES.CLIENT_LOGIN}?${new URLSearchParams({ [NEXT_PARAM]: next })}`;
}

/**
 * `?next=` from a query string, if it's a path on this site; otherwise
 * `fallback`. Anything else is refused: the link arrives by email, so
 * `?next=https://…` or `?next=//…` would make the sign-in page a redirect to
 * whatever site a forged link named.
 */
export function readNextPath(search: string, fallback: string): string {
  const next = new URLSearchParams(search).get(NEXT_PARAM);
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
