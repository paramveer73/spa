/// <reference types="vite/client" />

// Vite resolves `import "./x.css"` at build time, but TypeScript needs to be
// told the module exists or it errors on the side-effect import.
declare module "*.css";
