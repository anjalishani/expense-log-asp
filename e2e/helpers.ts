import type { Page } from '@playwright/test'

const STORAGE_KEY = 'expense-log:v1'

// Seeds an explicit *empty* envelope so the app boots with a blank slate
// instead of story #21's real seed data (which storage.load() writes only
// when the key is absent) — the deterministic starting point every other
// e2e spec needs. Must run via addInitScript, before the app's first script,
// so the key is already present the moment storage.load() runs on mount.
//
// addInitScript re-runs on every navigation in the page, not just the first —
// including a test's own page.reload(). Only writing when the key is still
// absent means a reload after the app has since persisted real data (adding
// an expense, setting a limit) leaves that data alone instead of wiping it
// back to empty on every reload, which would make persistence untestable.
export async function seedEmptyStorage(page: Page) {
  await page.addInitScript(
    ({ key }) => {
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, JSON.stringify({ version: 1, expenses: [], limits: {} }))
      }
    },
    { key: STORAGE_KEY },
  )
}

export async function addExpense(page: Page, date: string, amount: string, category: string) {
  await page.getByLabel('Date').fill(date)
  await page.getByLabel('Amount').fill(amount)
  await page.getByRole('combobox', { name: 'Category' }).selectOption(category)
  await page.getByRole('button', { name: 'Add expense' }).click()
}

export async function setMonthlyLimit(page: Page, amount: string) {
  await page.getByLabel('Monthly limit').fill(amount)
  await page.getByRole('button', { name: 'Set limit' }).click()
}
