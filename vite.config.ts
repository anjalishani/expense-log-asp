import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves a project site under /<repo>/, not /. Scoped to the
  // production build only — dev keeps base '/' so Playwright's fixed
  // localhost:5173 baseURL (playwright.config.ts) still resolves.
  base: command === 'build' ? '/expense-log-asp/' : '/',
  server: {
    // strictPort so a busy 5173 fails loudly rather than silently moving to
    // 5174 — Playwright pins a fixed baseURL and would otherwise hit a stale app.
    port: 5173,
    strictPort: true,
  },
}))
