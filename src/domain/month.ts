import type { MonthKey } from './types'

export function nextMonth(month: MonthKey): MonthKey {
  const year = Number(month.slice(0, 4))
  const monthNumber = Number(month.slice(5, 7))
  if (monthNumber === 12) {
    return `${year + 1}-01`
  }
  return `${year}-${String(monthNumber + 1).padStart(2, '0')}`
}

export function previousMonth(month: MonthKey): MonthKey {
  const year = Number(month.slice(0, 4))
  const monthNumber = Number(month.slice(5, 7))
  if (monthNumber === 1) {
    return `${year - 1}-12`
  }
  return `${year}-${String(monthNumber - 1).padStart(2, '0')}`
}
