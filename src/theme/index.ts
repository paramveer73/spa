import { createTheme, type Theme } from "@mui/material/styles";

/**
 * Two palettes, one shape. Every component reads semantic tokens
 * (`background.paper`, `text.primary`, `divider`) rather than hex literals,
 * so the whole site inverts correctly when the mode flips — including the
 * glass cards, which switch from white-on-photo to black-on-photo.
 *
 * The brand browns are lifted from the live Wix site (#5C4634 heading brown,
 * #B08968 accent) so the rebuild stays recognisably KTLN.
 */
export const BRAND = {
  brown: "#5C4634",
  brownDeep: "#3D2E21",
  accent: "#B08968",
  accentSoft: "#D9C2AC",
  cream: "#FAF6F1",
  sand: "#F0E7DD",
  ink: "#241D18",
} as const;

const DISPLAY_STACK = '"Open Sauce One", -apple-system, BlinkMacSystemFont, sans-serif';

/** Shared across both modes — only colour differs between light and dark. */
const shared = {
  typography: {
    fontFamily: DISPLAY_STACK,
    // Tight, heavy display type. The clamp() sizes keep headings fluid
    // without a single media query.
    h1: { fontWeight: 800, lineHeight: 0.82, letterSpacing: "-0.03em" },
    h2: { fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.025em" },
    h3: { fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.015em" },
    button: { fontWeight: 700, letterSpacing: "0.04em", textTransform: "none" as const },
    overline: {
      fontWeight: 600,
      fontSize: "0.7rem",
      letterSpacing: "0.22em",
      textTransform: "uppercase" as const,
    },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body": { height: "100%", margin: 0, padding: 0 },
        // min-height, not height: #root must be free to grow past the
        // viewport. Pinning it to 100% caps the containing block, which
        // breaks position: sticky for anything inside a taller track.
        "#root": { minHeight: "100%" },
        // Anchor targets must clear the fixed navbar.
        "section[id]": { scrollMarginTop: "88px" },
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          // Deliberately NOT overflow-x: hidden. It computes overflow-y to
          // `auto`, which promotes <body> to a scroll container — and a
          // sticky element then resolves against that scrollport instead of
          // the page, so it silently stops sticking. Horizontal overflow is
          // handled at the offending elements instead (measured at 0px).
        },
        // GSAP drives its own transforms; honour reduced-motion globally.
        "@media (prefers-reduced-motion: reduce)": {
          "*": { animationDuration: "0.01ms !important", transitionDuration: "0.01ms !important" },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, transition: "transform .25s ease, background-color .25s ease" },
      },
    },
  },
} as const;

export function buildTheme(mode: "light" | "dark"): Theme {
  const isLight = mode === "light";

  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: { main: isLight ? BRAND.brown : BRAND.accentSoft },
      secondary: { main: BRAND.accent },
      background: {
        default: isLight ? "#FFFFFF" : "#141110",
        paper: isLight ? BRAND.cream : "#1E1917",
      },
      text: {
        primary: isLight ? BRAND.ink : "#F5EFE8",
        secondary: isLight ? "#6F635A" : "#B8A99B",
      },
      divider: isLight ? "rgba(92,70,52,.14)" : "rgba(245,239,232,.14)",
    },
  });
}

export default buildTheme;
