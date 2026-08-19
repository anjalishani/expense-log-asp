import type { Limits, MonthKey } from './types'

export function resolveLimit(limits: Limits, month: MonthKey): number | undefined {
  const explicit = limits[month]
  if (explicit !== undefined) return explicit

  const earlierMonths = Object.keys(limits).filter((key) => key < month)
  if (earlierMonths.length === 0) return undefined

  const nearest = earlierMonths.reduce((latest, key) => (key > latest ? key : latest))
  return limits[nearest]
}
