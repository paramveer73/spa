import { useEffect, useState } from "react";

/**
 * Natural width ÷ height of `src`, or 0 until the image has loaded.
 *
 * MaskedCard needs the ratio rather than a width at some fixed height: to
 * cover a section it has to know whether the photo is proportionally wider
 * or narrower than the section, and that flips with the window's shape.
 */
export default function useImageAspect(src: string): number {
  const [aspect, setAspect] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled || !img.naturalHeight) return;
      setAspect(img.naturalWidth / img.naturalHeight);
    };
    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [src]);

  return aspect;
}
