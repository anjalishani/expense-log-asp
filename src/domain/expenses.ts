import { CATEGORIES } from './types'
import type { Category, Expense, MonthKey } from './types'

export function expensesInMonth(expenses: Expense[], month: MonthKey): Expense[] {
  return expenses
    .filter((expense) => expense.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export type CategoryTotal = { category: Category; total: number }

export function categoryTotals(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<Category, number>()
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount)
  }

  // Fixed-order rows for the known categories first, ...
  const known = CATEGORIES.flatMap((category) => {
    const total = totals.get(category)
    return total === undefined ? [] : [{ category, total }]
  })

  // ...then anything outside CATEGORIES (e.g. a legacy value from data
  // persisted under a category that has since been renamed or removed).
  // These must never be silently dropped — that would understate spend
  // with no indication anything was excluded.
  const unknown = [...totals]
    .filter(([category]) => !CATEGORIES.includes(category))
    .map(([category, total]) => ({ category, total }))

  return [...known, ...unknown]
}
