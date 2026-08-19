import { defineConfig, devices } from '@playwright/test'

// Matches vite.config.ts's strictPort dev server (port 5173, never drifts) so
// the suite's baseURL and the webServer readiness probe always agree on the
// same address.
const baseURL = 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Starts the real dev server and waits for it to come up before the suite
  // runs. reuseExistingServer lets a locally running `npm run dev` be reused
  // instead of double-starting on the (strict) 5173 port.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
