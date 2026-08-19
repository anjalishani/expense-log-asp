import { describe, expect, it } from 'vitest'
import { expensesInMonth } from './expenses'
import type { Expense } from './types'

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: '1',
    date: '2026-08-01',
    amount: 100,
    category: 'Groceries',
    ...overrides,
  }
}

describe('expensesInMonth', () => {
  it('excludes expenses from other months', () => {
    const inMonth = expense({ id: '1', date: '2026-08-15' })
    const outOfMonth = expense({ id: '2', date: '2026-07-31' })

    const result = expensesInMonth([inMonth, outOfMonth], '2026-08')

    expect(result).toEqual([inMonth])
  })

  it('orders results newest first', () => {
    const earliest = expense({ id: '1', date: '2026-08-01' })
    const latest = expense({ id: '2', date: '2026-08-20' })
    const middle = expense({ id: '3', date: '2026-08-10' })

    const result = expensesInMonth([earliest, latest, middle], '2026-08')

    expect(result).toEqual([latest, middle, earliest])
  })

  it('keeps insertion order stable for equal dates', () => {
    const first = expense({ id: '1', date: '2026-08-10' })
    const second = expense({ id: '2', date: '2026-08-10' })
    const third = expense({ id: '3', date: '2026-08-10' })

    const result = expensesInMonth([first, second, third], '2026-08')

    expect(result).toEqual([first, second, third])
  })

  it('does not leak an expense from the same day-of-month in a different year', () => {
    const wrongYear = expense({ id: '1', date: '2025-08-15' })
    const rightYear = expense({ id: '2', date: '2026-08-15' })

    const result = expensesInMonth([wrongYear, rightYear], '2026-08')

    expect(result).toEqual([rightYear])
  })

  it('returns an empty array when nothing matches', () => {
    const outOfMonth = expense({ date: '2026-07-15' })

    const result = expensesInMonth([outOfMonth], '2026-08')

    expect(result).toEqual([])
  })
})
