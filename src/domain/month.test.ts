import { describe, expect, it } from 'vitest'
import { nextMonth, previousMonth } from './month'

describe('nextMonth', () => {
  it('advances to the following month', () => {
    expect(nextMonth('2026-08')).toBe('2026-09')
  })

  it('rolls over into the next year from December', () => {
    expect(nextMonth('2026-12')).toBe('2027-01')
  })
})

describe('previousMonth', () => {
  it('moves back to the prior month', () => {
    expect(previousMonth('2026-08')).toBe('2026-07')
  })

  it('rolls back into the prior year from January', () => {
    expect(previousMonth('2026-01')).toBe('2025-12')
  })
})
