/// <reference types="vite/client" />

// Vite resolves `import "./x.css"` at build time, but TypeScript needs to be
// told the module exists or it errors on the side-effect import.
declare module "*.css";

// The variables in .env.development / .env.production. Empty until filled in,
// which the booking page reports as "card payments aren't set up yet".
interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
