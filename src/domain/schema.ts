import type { Expense, StoredState } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isExpense(value: unknown): value is Expense {
  if (!isRecord(value)) return false
  const { id, date, amount, category } = value
  // category isn't checked against CATEGORIES: categoryTotals() renders
  // unknown categories rather than dropping them, so a legacy value must
  // survive validation too.
  return (
    typeof id === 'string' &&
    typeof date === 'string' &&
    typeof amount === 'number' &&
    amount > 0 &&
    typeof category === 'string'
  )
}

function isLimits(value: unknown): value is StoredState['limits'] {
  if (!isRecord(value)) return false
  return Object.values(value).every((amount) => typeof amount === 'number')
}

export function parseStoredState(data: unknown): StoredState | null {
  if (!isRecord(data)) return null
  if (data.version !== 1) return null
  if (!Array.isArray(data.expenses) || !data.expenses.every(isExpense)) return null
  if (!isLimits(data.limits)) return null

  return {
    version: 1,
    expenses: data.expenses,
    limits: data.limits,
  }
}
