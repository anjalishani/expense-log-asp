import type { Expense } from '../domain/types'

export function expense(overrides: Partial<Expense>): Expense {
  return {
    id: '1',
    date: '2026-08-01',
    amount: 100,
    category: 'Groceries',
    ...overrides,
  }
}
