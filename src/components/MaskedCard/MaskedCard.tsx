import Box, { type BoxProps } from "@mui/material/Box";
import type { CSSProperties, ReactNode, Ref } from "react";
import type { MaskPosition } from "@/hooks";

export interface MaskedCardProps extends Omit<BoxProps, "position" | "ref"> {
  bgImage: string;
  position?: MaskPosition;
  /** Natural width ÷ height of bgImage — see useImageAspect. 0 while loading. */
  imageAspect: number;
  /** Crop anchor when the photo is wider than the section: 0 = left edge, 1 = right. */
  focalX?: number;
  /** Crop anchor when the photo is taller than the section: 0 = top edge, 1 = bottom. */
  focalY?: number;
  cardRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

/**
 * One window onto a section-wide photograph.
 *
 * Every card in a section paints the same image at the same scale and then
 * shifts it by its own offset within the section. The result is a single
 * continuous photo that appears to sit *behind* the layout, with the gaps
 * between cards cutting through it — rather than each card holding its own
 * separately-cropped copy.
 *
 * The photo is scaled to *cover* the section: whichever axis runs out first
 * sets the scale and the other overflows. `focalX` / `focalY` choose which
 * part of the overflow stays visible, so the interesting part of the frame
 * (usually a face) lands inside the section rather than off its edge.
 */
export default function MaskedCard({
  bgImage,
  position,
  imageAspect,
  focalX = 0.5,
  focalY = 0.5,
  cardRef,
  children,
  sx,
  style,
  ...rest
}: MaskedCardProps) {
  // Until the section is measured and the photo's shape is known there is
  // nothing sensible to paint; render a plain surface so layout still settles.
  const maskStyle: CSSProperties =
    position && imageAspect
      ? (() => {
          // Cover, not fit-to-height. Sizing by height alone left the photo
          // narrower than the section on wide windows, so its right edge
          // showed as a hard cut into the page background.
          const width = Math.max(position.sw, position.sh * imageAspect);
          const height = width / imageAspect;
          const offsetX = (width - position.sw) * focalX;
          const offsetY = (height - position.sh) * focalY;
          return {
            backgroundImage: `url(${bgImage})`,
            backgroundSize: `${width}px ${height}px`,
            backgroundPosition: `${-(position.x + offsetX)}px ${-(position.y + offsetY)}px`,
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
