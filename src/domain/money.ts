export type ParseAmountResult = { ok: true; minorUnits: number } | { ok: false; error: string }

const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/

export function parseAmountToMinorUnits(input: string): ParseAmountResult {
  const trimmed = input.trim()
  if (!AMOUNT_PATTERN.test(trimmed)) {
    return { ok: false, error: 'Enter a valid amount' }
  }

  const isNegative = trimmed.startsWith('-')
  const [wholePart, fractionPart = ''] = (isNegative ? trimmed.slice(1) : trimmed).split('.')
  const magnitude = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'))
  const minorUnits = isNegative ? -magnitude : magnitude

  if (minorUnits <= 0) {
    return { ok: false, error: 'Amount must be greater than zero' }
  }

  return { ok: true, minorUnits }
}

export function formatMinorUnits(minorUnits: number): string {
  const isNegative = minorUnits < 0
  const absolute = Math.abs(minorUnits)
  const whole = Math.trunc(absolute / 100)
  const cents = absolute % 100
  return `${isNegative ? '-' : ''}${whole}.${cents.toString().padStart(2, '0')}`
}
