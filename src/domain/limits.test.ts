import { describe, expect, it } from 'vitest'
import { budgetStatus, resolveLimit } from './limits'
import type { Limits } from './types'

describe('resolveLimit', () => {
  it('uses the explicit limit set for the month', () => {
    const limits: Limits = { '2026-08': 150000 }
    expect(resolveLimit(limits, '2026-08')).toBe(150000)
  })

  it('prefers the explicit limit over an earlier one', () => {
    const limits: Limits = { '2026-07': 100000, '2026-08': 150000 }
    expect(resolveLimit(limits, '2026-08')).toBe(150000)
  })

  it('falls back to the nearest earlier month when the month has no explicit limit', () => {
    const limits: Limits = { '2026-07': 100000 }
    expect(resolveLimit(limits, '2026-08')).toBe(100000)
  })

  it('carries forward across a gap of several unset months', () => {
    const limits: Limits = { '2026-04': 100000 }
    expect(resolveLimit(limits, '2026-08')).toBe(100000)
  })

  it('picks the nearest of several earlier limits, not the earliest', () => {
    const limits: Limits = { '2026-01': 50000, '2026-06': 200000 }
    expect(resolveLimit(limits, '2026-08')).toBe(200000)
  })

  it('ignores a later month\'s limit entirely', () => {
    const limits: Limits = { '2026-09': 150000 }
    expect(resolveLimit(limits, '2026-08')).toBeUndefined()
  })

  it('returns undefined, never zero, when there is no earlier limit anywhere', () => {
    const limits: Limits = {}
    expect(resolveLimit(limits, '2026-08')).toBeUndefined()
  })

  it('carries forward correctly across a year boundary', () => {
    const limits: Limits = { '2025-12': 100000 }
    expect(resolveLimit(limits, '2026-01')).toBe(100000)
  })
})

describe('budgetStatus', () => {
  it('is "no-limit" when there is no resolved limit', () => {
    expect(budgetStatus(undefined, 5000)).toBe('no-limit')
  })

  it('is "under" when spend is below the limit', () => {
    expect(budgetStatus(150000, 100000)).toBe('under')
  })

  it('is "under" when spend exactly equals the limit — passed means over, not reached', () => {
    expect(budgetStatus(150000, 150000)).toBe('under')
  })

  it('is "over" once spend exceeds the limit by a single minor unit', () => {
    expect(budgetStatus(150000, 150001)).toBe('over')
  })
})
