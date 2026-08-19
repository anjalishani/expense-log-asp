import { test, expect } from '@playwright/test'

// This suite only proves the Playwright harness itself works end-to-end
// (issue #8 / backlog story 1.3): dev server auto-start, a real browser
// render, and localStorage seeding via addInitScript. The actual add-expense
// and budget-limit journeys are separate backlog stories (#26, #27).

test('app loads and renders the expense log', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Expense Log' })).toBeVisible()
  await expect(page.getByLabel('Date')).toBeVisible()
  await expect(page.getByLabel('Amount')).toBeVisible()
  await expect(page.getByLabel('Category')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add expense' })).toBeVisible()
})

test('localStorage can be seeded before page load via addInitScript', async ({ page }) => {
  // There is no persistence layer yet (src/storage/ is empty, that's epic 4),
  // so this seeds an arbitrary key rather than a real app fixture — it only
  // demonstrates that addInitScript runs before the app's first script.
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e-harness-check', 'seeded')
  })

  await page.goto('/')

  const seeded = await page.evaluate(() => window.localStorage.getItem('e2e-harness-check'))
  expect(seeded).toBe('seeded')
})
