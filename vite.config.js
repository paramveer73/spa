import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const BRAND_FILE = new URL('./src/data/brand.json', import.meta.url)

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Fills index.html's %BRAND_TITLE% and %BRAND_DESCRIPTION% from brand.json, so
 * the page title — the part crawlers and link previews read before any JS
 * runs — is edited in the same file as the rest of the company's copy.
 * Runs `pre` so Vite's own %ENV% substitution never sees these names.
 */
function brandHtml() {
  return {
    name: 'brand-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const { seo } = JSON.parse(readFileSync(BRAND_FILE, 'utf8'))
        return html
          .replaceAll('%BRAND_TITLE%', escapeHtml(seo.title))
          .replaceAll('%BRAND_DESCRIPTION%', escapeHtml(seo.description))
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), brandHtml()],
  resolve: {
    alias: {
      // The admin/booking components imported from the other project use "@/".
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
