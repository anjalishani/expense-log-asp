import { describe, expect, it } from 'vitest'
import { reducer, type ExpenseState } from './reducer'
import type { Expense } from '../domain/types'

const expense: Expense = {
  id: '1',
  date: '2026-08-19',
  amount: 1234,
  category: 'Groceries',
}

describe('reducer', () => {
  it('appends an expense to an empty state', () => {
    const initial: ExpenseState = { expenses: [] }
    const next = reducer(initial, { type: 'ADD_EXPENSE', expense })
    expect(next.expenses).toEqual([expense])
  })

  it('appends an expense without discarding existing ones', () => {
    const other: Expense = { ...expense, id: '2', category: 'Rent' }
    const initial: ExpenseState = { expenses: [other] }
    const next = reducer(initial, { type: 'ADD_EXPENSE', expense })
    expect(next.expenses).toEqual([other, expense])
  })

  it('does not mutate the previous state', () => {
    const initial: ExpenseState = { expenses: [] }
    reducer(initial, { type: 'ADD_EXPENSE', expense })
    expect(initial.expenses).toEqual([])
  })
})
