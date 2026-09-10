import { useEffect, useState } from "react";

/**
 * How wide `src` would render if scaled to exactly fill `sectionHeight`.
 *
 * The masked cards size their background by height (`backgroundSize: auto Npx`)
 * so every card shares one scale. That means the image is almost always wider
 * than the section, and we need to know by how much in order to slide the
 * focal point horizontally — see MaskedCard's `focalX`.
 *
 * Returns 0 until the image's intrinsic size is known, which callers treat as
 * "no horizontal offset yet".
 */
export default function useImageWidth(src: string, sectionHeight: number): number {
  const [naturalRatio, setNaturalRatio] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled || !img.naturalHeight) return;
      setNaturalRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [src]);

  return naturalRatio ? naturalRatio * sectionHeight : 0;
}
