import { useEffect, useRef, useState } from "react";

import { getCachedImageSrc } from "../utils/imageCache";

/**
 * Resolves `src` through the browser's Cache Storage (see utils/imageCache).
 * Returns the original `src` immediately — so there's always something to
 * render right away — then swaps to the cached blob: URL once one is ready.
 *
 * Shared by <CachedImage> (for <img> tags) and anywhere an image feeds a CSS
 * background-image instead, like the homepage hero photo.
 */
export default function useCachedImageUrl(src) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setResolvedSrc(src);

    getCachedImageSrc(src).then((resolved) => {
      if (cancelled) return;
      if (resolved && resolved.startsWith("blob:")) {
        objectUrlRef.current = resolved;
      }
      setResolvedSrc(resolved);
    });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src]);

  return resolvedSrc;
}
