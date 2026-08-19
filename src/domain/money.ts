export type ParseAmountResult = { ok: true; minorUnits: number } | { ok: false; error: string }

const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/

export function parseAmountToMinorUnits(input: string): ParseAmountResult {
  const trimmed = input.trim()
  if (!AMOUNT_PATTERN.test(trimmed)) {
    return { ok: false, error: 'Enter a valid amount' }
  }

  const [wholePart, fractionPart = ''] = trimmed.split('.')
  const minorUnits = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'))

  if (minorUnits <= 0) {
    return { ok: false, error: 'Amount must be greater than zero' }
  }

  return { ok: true, minorUnits }
}

export function formatMinorUnits(minorUnits: number): string {
  const whole = Math.trunc(minorUnits / 100)
  const cents = Math.abs(minorUnits % 100)
  return `${whole}.${cents.toString().padStart(2, '0')}`
}
