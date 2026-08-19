import type { Expense, MonthKey } from './types'

export function expensesInMonth(expenses: Expense[], month: MonthKey): Expense[] {
  return expenses
    .filter((expense) => expense.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date))
}
