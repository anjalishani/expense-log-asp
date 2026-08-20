import { test, expect } from '@playwright/test'
import { addExpense, seedEmptyStorage, setMonthlyLimit } from './helpers'

// Backlog story 5.2 / issue #26, per its acceptance criteria: seeds
// localStorage via addInitScript (now that epic 4 has landed a persistence
// layer) with an empty envelope, so this is independent of both the real
// seed data (story #21) and today's date, which is pinned via Playwright's
// clock for the same reason.

test(
  'adds an expense to the current month and moves the list, totals, and remaining budget by exactly that amount',
  { tag: '@issue-26' },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-15T09:00:00'))
    await seedEmptyStorage(page)
    await page.goto('/')

    await setMonthlyLimit(page, '500')

    await expect(page.getByTestId('no-expenses')).toBeVisible()
    await expect(page.getByTestId('no-spending')).toBeVisible()
    await expect(page.getByTestId('remaining')).toHaveText('Remaining: 500.00')

    await addExpense(page, '2026-06-15', '42.50', 'Groceries')

    const expenses = page.getByRole('list', { name: 'Expenses' })
    await expect(expenses).toContainText('2026-06-15')
    await expect(expenses).toContainText('42.50')
    await expect(expenses).toContainText('Groceries')

    await expect(page.getByTestId('month-total')).toContainText('42.50')
    await expect(page.getByTestId('category-total-Groceries')).toContainText('42.50')
    await expect(page.getByTestId('remaining')).toHaveText('Remaining: 457.50')
  },
)
