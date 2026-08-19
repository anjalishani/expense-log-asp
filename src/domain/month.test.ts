import { describe, expect, it } from 'vitest'
import { formatMonthLabel, nextMonth, previousMonth } from './month'

describe('nextMonth', () => {
  it('advances to the following month', () => {
    expect(nextMonth('2026-08')).toBe('2026-09')
  })

  it('rolls over into the next year from December', () => {
    expect(nextMonth('2026-12')).toBe('2027-01')
  })

  it.each(['2026-13', '2026-00', '2026-1', '2026', 'not-a-month', ''])(
    'rejects the malformed month key %s instead of producing a further-invalid key',
    (malformed) => {
      expect(() => nextMonth(malformed)).toThrow('Invalid month key')
    },
  )
})

describe('previousMonth', () => {
  it('moves back to the prior month', () => {
    expect(previousMonth('2026-08')).toBe('2026-07')
  })

  it('rolls back into the prior year from January', () => {
    expect(previousMonth('2026-01')).toBe('2025-12')
  })

  it.each(['2026-13', '2026-00', '2026-1', '2026', 'not-a-month', ''])(
    'rejects the malformed month key %s instead of producing a further-invalid key',
    (malformed) => {
      expect(() => previousMonth(malformed)).toThrow('Invalid month key')
    },
  )
})

describe('formatMonthLabel', () => {
  it('formats a month as a full name and year', () => {
    expect(formatMonthLabel('2026-08')).toBe('August 2026')
  })

  it('formats January correctly', () => {
    expect(formatMonthLabel('2026-01')).toBe('January 2026')
  })

  it.each(['2026-13', '2026-00', '2026-1', '2026', 'not-a-month', ''])(
    'rejects the malformed month key %s instead of rendering "Unknown month" or "NaN"',
    (malformed) => {
      expect(() => formatMonthLabel(malformed)).toThrow('Invalid month key')
    },
  )
})
