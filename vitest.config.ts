import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ holds Playwright specs, run via `npm run test:e2e`, not Vitest.
    // .claude/worktrees/** holds isolated git worktrees the Agent tool creates
    // for background subagents — each is a full checkout with its own tests,
    // which would otherwise run a second time (and, if stale, fail) here.
    exclude: [...configDefaults.exclude, 'e2e/**', '.claude/worktrees/**'],
  },
})
