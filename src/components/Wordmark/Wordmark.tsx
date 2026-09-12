import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { brand } from "@/data";

export interface WordmarkProps {
  /** "sm" is the splash-screen treatment; "md" opens the hero. */
  size?: "sm" | "md";
  /** Adds the location line beneath the name. */
  showLocation?: boolean;
  align?: "left" | "center";
}

/**
 * The studio name set wide and small — the treatment from the splash screen,
 * which is the one piece of type the studio singled out. Kept in one component
 * so the loader and the page can't drift apart.
 */
const SIZES = {
  sm: { name: { xs: 11, md: 13 }, location: { xs: 8, md: 9 }, tracking: "0.3em" },
  md: { name: { xs: 12, md: 15 }, location: { xs: 9, md: 10 }, tracking: "0.42em" },
} as const;

export default function Wordmark({ size = "sm", showLocation = true, align = "left" }: WordmarkProps) {
  const scale = SIZES[size];

  return (
    <Box sx={{ textAlign: align }}>
      <Typography
        sx={{
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: scale.tracking,
          fontSize: scale.name,
          lineHeight: 1.2,
          // Tracking adds space after the last letter too, which throws a
          // centred line visibly left; one tracking unit of indent balances it.
          textIndent: align === "center" ? scale.tracking : 0,
        }}
      >
        {brand.name}
      </Typography>
      {showLocation && (
        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: "text.secondary",
            fontSize: scale.location,
            textIndent: align === "center" ? "0.22em" : 0,
          }}
        >
          {brand.location}
        </Typography>
      )}
    </Box>
  );
}
