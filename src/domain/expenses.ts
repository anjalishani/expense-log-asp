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

  return CATEGORIES.flatMap((category) => {
    const total = totals.get(category)
    return total === undefined ? [] : [{ category, total }]
  })
}

export function monthTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}
