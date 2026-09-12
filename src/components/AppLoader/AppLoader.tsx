import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

/**
 * Suspense fallback while a page's chunk downloads. Deliberately quiet — a
 * thin bar on the page background — because the home page follows it with its
 * own branded splash, and a second full-screen loader would read as a stutter.
 */
export default function AppLoader() {
  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: 100, bgcolor: "background.default" }}>
      <LinearProgress aria-label="Loading page" sx={{ height: 2 }} />
    </Box>
  );
}
