import { test, expect } from '@playwright/test'
import { addExpense, seedEmptyStorage, setMonthlyLimit } from './helpers'

// Backlog story 2.4 / issue #14. As in the other e2e suites, setup seeds an
// empty localStorage envelope via addInitScript rather than relying on the
// real seed data (story #21), with a frozen clock so month arithmetic is
// independent of the real date too.

test('Next/Previous move unboundedly, cross a year boundary, and the list/totals/limit follow the selected month', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-12-15T09:00:00'))
  await seedEmptyStorage(page)
  await page.goto('/')

  await expect(page.getByTestId('current-month')).toHaveText('December 2026')

  await setMonthlyLimit(page, '200')
  await addExpense(page, '2026-12-15', '50.00', 'Groceries')

  await expect(page.getByTestId('month-total')).toContainText('50.00')
  await expect(page.getByTestId('remaining')).toHaveText('Remaining: 150.00')

  // Forward across the year boundary: no expenses here, but the limit
  // carries forward from December (domain/limits.ts's resolveLimit).
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByTestId('current-month')).toHaveText('January 2027')
  await expect(page.getByTestId('no-expenses')).toBeVisible()
  await expect(page.getByTestId('remaining')).toHaveText('Remaining: 200.00')

  // Back across the year boundary: December's expense and limit are untouched.
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByTestId('current-month')).toHaveText('December 2026')
  await expect(page.getByTestId('month-total')).toContainText('50.00')
  await expect(page.getByTestId('remaining')).toHaveText('Remaining: 150.00')

  // Further back to a month with no expenses and no limit at all —
  // November has no explicit limit and nothing earlier to carry forward.
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByTestId('current-month')).toHaveText('November 2026')
  await expect(page.getByTestId('no-expenses')).toBeVisible()
  await expect(page.getByTestId('no-limit')).toBeVisible()
  await expect(page.getByTestId('remaining')).toHaveCount(0)
})
