import { describe, expect, it } from 'vitest'
import { formatMinorUnits, parseAmountToMinorUnits } from './money'

describe('parseAmountToMinorUnits', () => {
  it('parses a whole euro amount into cents', () => {
    const result = parseAmountToMinorUnits('12')
    expect(result).toEqual({ ok: true, minorUnits: 1200 })
  })

  it('parses a decimal euro amount into cents', () => {
    const result = parseAmountToMinorUnits('12.34')
    expect(result).toEqual({ ok: true, minorUnits: 1234 })
  })

  it('rejects unparseable input', () => {
    const result = parseAmountToMinorUnits('abc')
    expect(result.ok).toBe(false)
  })

  it('rejects zero', () => {
    const result = parseAmountToMinorUnits('0')
    expect(result.ok).toBe(false)
  })

  it('rejects negative amounts', () => {
    const result = parseAmountToMinorUnits('-5')
    expect(result.ok).toBe(false)
  })
})

describe('formatMinorUnits', () => {
  it('formats cents back into a two-decimal euro string', () => {
    expect(formatMinorUnits(1234)).toBe('12.34')
  })

  it('pads a single-digit cent value', () => {
    expect(formatMinorUnits(1205)).toBe('12.05')
  })

  it('round-trips through parse and format', () => {
    const parsed = parseAmountToMinorUnits('1180.00')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(formatMinorUnits(parsed.minorUnits)).toBe('1180.00')
    }
  })
})
