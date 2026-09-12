import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { brand } from "@/data/brand";
import { buildTheme } from "./buildTheme";

// Namespaced by brand so two sites built from this code never share a key.
const STORAGE_KEY = `${brand.slug}-color-mode`;

export type ColorMode = "light" | "dark";

interface ColorModeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

/** Remembered choice first, then the OS preference. */
function initialMode(): ColorMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private browsing can throw on access — fall through to the media query.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Read or flip the colour mode from anywhere below <ColorModeProvider>.
 *
 * Throws rather than returning null when the provider is missing. A context
 * that quietly yields null (as FirebaseContext does) turns a wiring mistake
 * into a crash somewhere far from its cause; this fails at the first render
 * with a message that names the fix.
 */
export function useColorMode(): ColorModeContextValue {
  const value = useContext(ColorModeContext);
  if (!value) throw new Error("useColorMode() must be used inside <ColorModeProvider>.");
  return value;
}

export interface ColorModeProviderProps {
  children: ReactNode;
}

/**
 * Owns the light/dark choice and the MUI theme built from it. Mode is
 * app-wide state, so it lives beside the theme it drives — not in App, and not
 * in the Navbar that happens to toggle it.
 */
export default function ColorModeProvider({ children }: ColorModeProviderProps) {
  const [mode, setMode] = useState<ColorMode>(initialMode);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Persisting is a convenience; never let it break the toggle.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
