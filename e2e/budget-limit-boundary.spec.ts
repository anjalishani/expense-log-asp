import { test, expect } from '@playwright/test'
import { addExpense, setMonthlyLimit } from './helpers'

// Backlog story 5.3 / issue #27, pinned against the over-limit warning built
// for issue #19. As in add-expense.spec.ts, setup goes through the UI with a
// frozen clock rather than localStorage seeding — there's no persistence
// layer yet (epic 4).

test('remaining reads zero with no warning exactly at the limit, and the warning appears one minor unit over — passed means over, not reached', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-06-15T09:00:00'))
  await page.goto('/')

  await setMonthlyLimit(page, '50.00')

  // Seed spend to one minor unit under the limit.
  await addExpense(page, '2026-06-15', '49.99', 'Groceries')
  await expect(page.getByTestId('remaining')).toHaveText('Remaining: 0.01')
  await expect(page.getByRole('alert')).toHaveCount(0)

  // One more minor unit brings spend to exactly the limit: zero remaining, still no warning.
  await addExpense(page, '2026-06-15', '0.01', 'Groceries')
  await expect(page.getByTestId('remaining')).toHaveText('Remaining: 0.00')
  await expect(page.getByRole('alert')).toHaveCount(0)

  // One minor unit past the limit: the warning must appear.
  await addExpense(page, '2026-06-15', '0.01', 'Groceries')
  await expect(page.getByTestId('remaining')).toHaveText('Remaining: -0.01')
  await expect(page.getByTestId('over-limit-warning')).toHaveAttribute('role', 'alert')
})
