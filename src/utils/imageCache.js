/**
 * Caches remote images in the browser's Cache Storage — the same mechanism
 * service workers use — so repeat views load instantly from disk instead of
 * re-downloading from Firebase Storage every time.
 *
 * This deliberately isn't localStorage. localStorage is a ~5MB string-only
 * store, so an image would have to be base64-encoded first — about 33%
 * larger, and the read/write API is synchronous, which blocks the main
 * thread on anything bigger than a tiny icon. A handful of full-size photos
 * would blow the quota outright. Cache Storage stores the actual binary
 * Response, is fully async, and browsers typically grant it a large slice
 * of free disk space (usually far more than localStorage's few MB).
 */

const CACHE_NAME = "orchid11-image-cache-v1";

// If the Firebase Storage bucket doesn't have a CORS policy allowing this
// origin, `fetch(src, { mode: "cors" })` below fails — and the browser logs
// that failure to the console itself (a blocked cross-origin request),
// independent of our try/catch. That's a one-time infra fix (run the
// `gsutil cors set firebase-storage-cors.json gs://<bucket>` command against
// firebase-storage-cors.json at the repo root), not something catchable
// from here. What we *can* control is not hammering the same doomed
// request on every remount: once a URL has failed this way in this tab,
// skip straight to the plain `src` for the rest of the session instead of
// trying (and logging) again.
const corsBlockedUrls = new Set();

// Known-in-advance: firebasestorage.googleapis.com has no CORS policy for
// this app's origins yet, so every fetch to it is guaranteed to fail — and
// since the browser logs that failure itself the instant the request is
// made, per-URL tracking above only helps on a *second* view of the same
// image; a fresh image never seen this session still fires one console
// error each. Skipping the attempt entirely for this host avoids that
// first-time noise too, with zero change to what's on screen (the
// fallback — plain `src` — is exactly what renders today regardless).
// Remove this entry once the `gsutil cors set` command has been run
// against the bucket, so caching actually starts working for these images.
const KNOWN_CORS_BLOCKED_HOSTNAMES = ["firebasestorage.googleapis.com"];

function isKnownCorsBlocked(src) {
  try {
    return KNOWN_CORS_BLOCKED_HOSTNAMES.includes(
      new URL(src, window.location.href).hostname,
    );
  } catch {
    return false;
  }
}

function isCacheStorageSupported() {
  return typeof window !== "undefined" && "caches" in window;
}

/**
 * Resolves a browser-local, cacheable URL for `src`. The first call for a
 * given URL fetches it and stores the response; every later call — even
 * after a full page reload — is served from Cache Storage with no network
 * request. Returns a blob: URL you can hand straight to <img src>.
 *
 * Falls back to returning the original `src` untouched if Cache Storage
 * isn't available (some private-browsing modes, very old browsers) or if
 * anything goes wrong (network error, quota exceeded, opaque cross-origin
 * response) — the browser's normal HTTP cache still applies in that case,
 * so the image never fails to load just because our cache layer did.
 */
export async function getCachedImageSrc(src) {
  if (
    !src ||
    !isCacheStorageSupported() ||
    corsBlockedUrls.has(src) ||
    isKnownCorsBlocked(src)
  ) {
    return src;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    let response = await cache.match(src);

    if (!response) {
      response = await fetch(src, { mode: "cors" });
      if (!response.ok) return src;
      // Cache a clone — the original response body gets consumed by
      // .blob() below, and a Response can only be read once.
      await cache.put(src, response.clone());
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    corsBlockedUrls.add(src);
    return src;
  }
}

/** Wipes every image this app has cached. Exposed for a future "clear cache" action. */
export async function clearImageCache() {
  if (!isCacheStorageSupported()) return;
  await caches.delete(CACHE_NAME);
}
