import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ holds Playwright specs, run via `npm run test:e2e`, not Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
