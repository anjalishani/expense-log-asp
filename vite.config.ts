import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub Pages serves a project site under /<repo>/, not /. Keyed on mode,
  // not command: `vite preview` reports command 'serve' just like `vite dev`
  // but defaults to mode 'production' since it serves the built dist — it
  // needs the same base as build, or the dist it serves 404s under it. Only
  // `vite dev` (mode 'development') keeps base '/', so Playwright's fixed
  // localhost:5173 baseURL (playwright.config.ts) still resolves.
  base: mode === 'production' ? '/expense-log-asp/' : '/',
  server: {
    // strictPort so a busy 5173 fails loudly rather than silently moving to
    // 5174 — Playwright pins a fixed baseURL and would otherwise hit a stale app.
    port: 5173,
    strictPort: true,
  },
}))
