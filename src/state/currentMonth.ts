import type { MonthKey } from '../domain/types'

export function currentMonthKey(): MonthKey {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}
