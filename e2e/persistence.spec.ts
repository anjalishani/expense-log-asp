import { test, expect } from '@playwright/test'
import { addExpense, seedEmptyStorage, setMonthlyLimit } from './helpers'

// Backlog stories 4.1 / issue #20 (persist) and 4.5 / issue #24 (clear all).
// Unit tests cover storage.ts and the reducer directly; this proves the same
// behaviour survives an actual page reload in a real browser.

test(
  'an added expense and a set limit survive a page reload',
  { tag: '@issue-20' },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-15T09:00:00'))
    await seedEmptyStorage(page)
    await page.goto('/')

    await setMonthlyLimit(page, '500')
    await addExpense(page, '2026-06-15', '42.50', 'Groceries')

    await page.reload()

    const expenses = page.getByRole('list', { name: 'Expenses' })
    await expect(expenses).toContainText('42.50')
    await expect(page.getByTestId('remaining')).toHaveText('Remaining: 457.50')
  },
)

test(
  'clearing all data empties the app, and it stays empty after a reload rather than re-seeding',
  { tag: '@issue-24' },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-15T09:00:00'))
    await seedEmptyStorage(page)
    await page.goto('/')
    page.on('dialog', (dialog) => dialog.accept())

    await setMonthlyLimit(page, '500')
    await addExpense(page, '2026-06-15', '42.50', 'Groceries')

    await page.getByRole('button', { name: 'Clear all data' }).click()
    await expect(page.getByTestId('no-expenses')).toBeVisible()
    await expect(page.getByTestId('no-limit')).toBeVisible()

    await page.reload()

    await expect(page.getByTestId('no-expenses')).toBeVisible()
    await expect(page.getByTestId('no-limit')).toBeVisible()
  },
)
