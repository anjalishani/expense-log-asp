import { test, expect } from '@playwright/test'
import { seedEmptyStorage } from './helpers'

// This suite only proves the Playwright harness itself works end-to-end
// (issue #8 / backlog story 1.3): dev server auto-start, a real browser
// render, and localStorage seeding via addInitScript. The actual add-expense
// and budget-limit journeys are separate backlog stories (#26, #27).

test('app loads and renders the expense log', async ({ page }) => {
  // Story #21 gives every genuinely-first load real seed data, so an
  // unseeded run here would have non-empty category totals — and the
  // combobox role query below is used instead of getByLabel('Category') for
  // exactly that reason (it's ambiguous once CategoryTotals' own
  // aria-label="Category totals" list has rows; see CLAUDE.md). Seeding an
  // empty envelope keeps this test about the harness, not the seed data.
  await seedEmptyStorage(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Expense Log' })).toBeVisible()
  await expect(page.getByLabel('Date')).toBeVisible()
  await expect(page.getByLabel('Amount')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Category' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add expense' })).toBeVisible()
})

test('localStorage seeded via addInitScript is what the app actually loads', async ({ page }) => {
  // Now that epic 4's persistence layer exists, this seeds the real storage
  // key with an empty envelope and asserts the app honours it (no seed data,
  // per story #21) — a genuine fixture rather than an arbitrary check key.
  await seedEmptyStorage(page)

  await page.goto('/')

  await expect(page.getByTestId('no-expenses')).toBeVisible()
})
