import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './types'
import { createSeedState } from './seed'

describe('createSeedState', () => {
  const today = '2026-08-15'

  it('creates ten expenses dated in the current month', () => {
    const { expenses } = createSeedState(today)
    const currentMonth = expenses.filter((expense) => expense.date.slice(0, 7) === '2026-08')
    expect(currentMonth).toHaveLength(10)
  })

  it('creates six expenses dated in the previous month', () => {
    const { expenses } = createSeedState(today)
    const previousMonth = expenses.filter((expense) => expense.date.slice(0, 7) === '2026-07')
    expect(previousMonth).toHaveLength(6)
  })

  it('totals current-month spend to exactly €1,180.00', () => {
    const { expenses } = createSeedState(today)
    const currentMonthTotal = expenses
      .filter((expense) => expense.date.slice(0, 7) === '2026-08')
      .reduce((sum, expense) => sum + expense.amount, 0)
    expect(currentMonthTotal).toBe(118_000)
  })

  it('sets an explicit €1,500.00 limit on the current month only', () => {
    const { limits } = createSeedState(today)
    expect(limits).toEqual({ '2026-08': 150_000 })
  })

  it('spreads current-month expenses across all five categories', () => {
    const { expenses } = createSeedState(today)
    const currentMonthCategories = new Set(
      expenses.filter((expense) => expense.date.slice(0, 7) === '2026-08').map((e) => e.category),
    )
    expect([...currentMonthCategories].sort()).toEqual([...CATEGORIES].sort())
  })

  it('gives every expense a positive amount', () => {
    const { expenses } = createSeedState(today)
    for (const expense of expenses) {
      expect(expense.amount).toBeGreaterThan(0)
    }
  })

  it('gives every expense a unique id', () => {
    const { expenses } = createSeedState(today)
    const ids = new Set(expenses.map((expense) => expense.id))
    expect(ids.size).toBe(expenses.length)
  })

  it('crosses a year boundary correctly when today is in January', () => {
    const { expenses } = createSeedState('2026-01-10')
    const currentMonth = expenses.filter((expense) => expense.date.slice(0, 7) === '2026-01')
    const previousMonth = expenses.filter((expense) => expense.date.slice(0, 7) === '2025-12')
    expect(currentMonth).toHaveLength(10)
    expect(previousMonth).toHaveLength(6)
  })
})
