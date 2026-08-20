import { test, expect } from '@playwright/test'
import { addExpense, setMonthlyLimit } from './helpers'

// Backlog story 5.2 / issue #26. Its acceptance criteria call for seeding
// localStorage via addInitScript, but there is no persistence layer yet
// (src/storage/ is still empty — epic 4; see smoke.spec.ts). This test pins
// "today" with Playwright's clock instead, so it's independent of the real
// date, and drives setup through the UI — the only state entry point that
// currently exists.

test(
  'adds an expense to the current month and moves the list, totals, and remaining budget by exactly that amount',
  { tag: '@issue-26' },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-15T09:00:00'))
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
