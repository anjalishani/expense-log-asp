import type { MonthKey } from './types'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// A MonthKey is only `type MonthKey = string` — there is no runtime validation
// at the type level. Every MonthKey in the app today is produced internally
// (currentMonthKey(), nextMonth(), previousMonth(), or `date.slice(0, 7)` on an
// already-validated Expense date), never typed in directly by a user the way a
// money amount is. So unlike money.ts — which returns a Result and rejects
// free-typed form input gracefully — this module treats a malformed MonthKey
// as a programming error and fails loudly rather than silently producing a
// further-invalid key or a garbled label.
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

function parseMonthKey(month: MonthKey): { year: number; monthNumber: number } {
  if (!MONTH_KEY_PATTERN.test(month)) {
    throw new Error(`Invalid month key: ${month}`)
  }
  return {
    year: Number(month.slice(0, 4)),
    monthNumber: Number(month.slice(5, 7)),
  }
}

function addMonths(month: MonthKey, delta: number): MonthKey {
  const { year, monthNumber } = parseMonthKey(month)
  const zeroBasedTotal = monthNumber - 1 + delta
  const newYear = year + Math.floor(zeroBasedTotal / 12)
  const newMonthNumber = ((zeroBasedTotal % 12) + 12) % 12
  return `${newYear}-${String(newMonthNumber + 1).padStart(2, '0')}`
}

export function nextMonth(month: MonthKey): MonthKey {
  return addMonths(month, 1)
}

export function previousMonth(month: MonthKey): MonthKey {
  return addMonths(month, -1)
}

export function formatMonthLabel(month: MonthKey): string {
  const { year, monthNumber } = parseMonthKey(month)
  const monthName = MONTH_NAMES[monthNumber - 1]
  if (monthName === undefined) {
    throw new Error(`Invalid month key: ${month}`)
  }
  return `${monthName} ${year}`
}
