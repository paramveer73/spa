import Box, { type BoxProps } from "@mui/material/Box";
import type { CSSProperties, ReactNode, Ref } from "react";
import type { MaskPosition } from "@/hooks";

export interface MaskedCardProps extends Omit<BoxProps, "position" | "ref"> {
  bgImage: string;
  position?: MaskPosition;
  /** Rendered width of the backdrop at the section's height — see useImageWidth. */
  imageWidth: number;
  /** 0 = anchor the crop to the image's left edge, 1 = its right edge. */
  focalX?: number;
  cardRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

/**
 * One window onto a section-wide photograph.
 *
 * Every card in a section paints the same image at the same scale
 * (`backgroundSize: auto <sectionHeight>px`) and then shifts it by its own
 * offset within the section. The result is a single continuous photo that
 * appears to sit *behind* the layout, with the gaps between cards cutting
 * through it — rather than each card holding its own separately-cropped copy.
 *
 * `focalX` handles the fact that a landscape photo scaled to the section's
 * height is almost always wider than the section. Rather than letting the
 * overflow fall off the right edge, we slide the whole image so the
 * interesting part of the frame (usually a face, right of centre in KTLN's
 * photography) lands inside the visible area.
 */
export default function MaskedCard({
  bgImage,
  position,
  imageWidth,
  focalX = 0.5,
  cardRef,
  children,
  sx,
  style,
  ...rest
}: MaskedCardProps) {
  // Until the section has been measured there is nothing sensible to paint;
  // render the card as a plain surface so layout still settles correctly.
  const maskStyle: CSSProperties = position
    ? (() => {
        const overflow = imageWidth > position.sw ? imageWidth - position.sw : 0;
        const focalOffset = overflow * focalX;
        return {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: `auto ${position.sh}px`,
          backgroundPosition: `-${position.x + focalOffset}px -${position.y}px`,
          backgroundRepeat: "no-repeat",
        };
      })()
    : {};

  return (
    <Box
      ref={cardRef}
      style={{ ...maskStyle, ...style }}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 3, md: 4 },
        bgcolor: "background.paper",
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
