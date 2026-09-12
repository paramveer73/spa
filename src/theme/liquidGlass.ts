import type { SystemStyleObject } from "@mui/system";
import type { Theme } from "@mui/material/styles";

/**
 * The "liquid glass" surface from the Flowpath hero experiment, as an sx
 * mixin: spread it into any `sx` — `sx={{ ...liquidGlass, p: 2 }}`.
 *
 * It's barely a fill at all (1% white). What reads as glass is the backdrop
 * blur, an inset top highlight, and a 1.4px rim that's brightest along the
 * top and bottom edges. The rim is a gradient on a pseudo-element whose
 * padding box is masked out, so only the border ring survives.
 *
 * Meant for surfaces over photography. It has no colour of its own, so it
 * reads the same in light and dark mode — put white text on it, not
 * text.primary.
 */
export const liquidGlass: SystemStyleObject<Theme> = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255, 255, 255, 0.01)",
  backgroundBlendMode: "luminosity",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "none",
  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    padding: "1.4px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, " +
      "rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.15) 80%, " +
      "rgba(255,255,255,0.45) 100%)",
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    pointerEvents: "none",
  },
};
