import { describe, expect, it } from 'vitest'
import { categoryTotals, expensesInMonth, monthTotal } from './expenses'
import { expense } from '../test/fixtures'
import type { Category } from './types'

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

  it('separates adjacent months when they straddle a year boundary', () => {
    const decemberExpense = expense({ id: '1', date: '2025-12-31' })
    const januaryExpense = expense({ id: '2', date: '2026-01-01' })

    expect(expensesInMonth([decemberExpense, januaryExpense], '2025-12')).toEqual([
      decemberExpense,
    ])
    expect(expensesInMonth([decemberExpense, januaryExpense], '2026-01')).toEqual([
      januaryExpense,
    ])
  })

  it('returns an empty array when nothing matches', () => {
    const outOfMonth = expense({ date: '2026-07-15' })

    const result = expensesInMonth([outOfMonth], '2026-08')

    expect(result).toEqual([])
  })
})

describe('categoryTotals', () => {
  it('sums amounts per category', () => {
    const result = categoryTotals([
      expense({ category: 'Groceries', amount: 100 }),
      expense({ category: 'Groceries', amount: 250 }),
      expense({ category: 'Transport', amount: 500 }),
    ])

    expect(result).toEqual([
      { category: 'Groceries', total: 350 },
      { category: 'Transport', total: 500 },
    ])
  })

  it('omits categories with no expenses', () => {
    const result = categoryTotals([expense({ category: 'Rent', amount: 1000 })])

    expect(result).toEqual([{ category: 'Rent', total: 1000 }])
  })

  it('orders rows by the fixed category order regardless of input order', () => {
    const result = categoryTotals([
      expense({ category: 'Other', amount: 10 }),
      expense({ category: 'Groceries', amount: 20 }),
      expense({ category: 'Rent', amount: 30 }),
    ])

    expect(result.map((row) => row.category)).toEqual(['Groceries', 'Rent', 'Other'])
  })

  it('returns an empty array when there are no expenses', () => {
    expect(categoryTotals([])).toEqual([])
  })

  it('keeps spend from a category outside the fixed list instead of dropping it', () => {
    // Simulates legacy/corrupted data (e.g. a category renamed after being
    // persisted) reaching this function with a value CATEGORIES no longer
    // lists. It must never be silently excluded from the totals — that would
    // understate spend with no indication anything was dropped.
    const legacyCategory = 'Subscriptions' as Category

    const result = categoryTotals([
      expense({ category: 'Groceries', amount: 100 }),
      expense({ category: legacyCategory, amount: 500 }),
    ])

    expect(result).toEqual([
      { category: 'Groceries', total: 100 },
      { category: legacyCategory, total: 500 },
    ])
  })
})

describe('monthTotal', () => {
  it('sums all expense amounts', () => {
    const result = monthTotal([
      expense({ category: 'Groceries', amount: 100 }),
      expense({ category: 'Transport', amount: 250 }),
    ])

    expect(result).toBe(350)
  })

  it('equals the sum of categoryTotals', () => {
    const expenses = [
      expense({ category: 'Groceries', amount: 100 }),
      expense({ category: 'Groceries', amount: 250 }),
      expense({ category: 'Transport', amount: 500 }),
    ]

    const sumOfCategories = categoryTotals(expenses).reduce((sum, row) => sum + row.total, 0)

    expect(monthTotal(expenses)).toBe(sumOfCategories)
  })

  it('returns zero for an empty list', () => {
    expect(monthTotal([])).toBe(0)
  })
})
