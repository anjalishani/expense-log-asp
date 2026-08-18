import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // strictPort so a busy 5173 fails loudly rather than silently moving to
    // 5174 — Playwright pins a fixed baseURL and would otherwise hit a stale app.
    port: 5173,
    strictPort: true,
  },
})
