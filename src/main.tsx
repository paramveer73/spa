import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import App from "./App";
import HeroLab from "./components/heroes/HeroLab";
import buildTheme from "./theme";

/**
 * `?heroes` mounts the hero comparison harness instead of the site. Keeps the
 * experiments reachable without adding a router or shipping them in the page.
 */
const showLab = new URLSearchParams(window.location.search).has("heroes");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {showLab ? (
      <ThemeProvider theme={buildTheme("dark")}>
        <CssBaseline />
        <HeroLab />
      </ThemeProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
