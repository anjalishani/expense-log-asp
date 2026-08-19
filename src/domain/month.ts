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

function parseMonthKey(month: MonthKey): { year: number; monthNumber: number } {
  return {
    year: Number(month.slice(0, 4)),
    monthNumber: Number(month.slice(5, 7)),
  }
}

export function nextMonth(month: MonthKey): MonthKey {
  const { year, monthNumber } = parseMonthKey(month)
  if (monthNumber === 12) {
    return `${year + 1}-01`
  }
  return `${year}-${String(monthNumber + 1).padStart(2, '0')}`
}

export function previousMonth(month: MonthKey): MonthKey {
  const { year, monthNumber } = parseMonthKey(month)
  if (monthNumber === 1) {
    return `${year - 1}-12`
  }
  return `${year}-${String(monthNumber - 1).padStart(2, '0')}`
}

export function formatMonthLabel(month: MonthKey): string {
  const { year, monthNumber } = parseMonthKey(month)
  const monthName = MONTH_NAMES[monthNumber - 1] ?? 'Unknown month'
  return `${monthName} ${year}`
}
