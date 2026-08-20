import { createSeedState } from '../domain/seed'
import { parseStoredState } from '../domain/schema'
import type { StoredState } from '../domain/types'

export const STORAGE_KEY = 'expense-log:v1'

export type LoadResult = { state: StoredState; wasCorrupt: boolean }

function seeded(today: string): StoredState {
  return { version: 1, ...createSeedState(today) }
}

export function load(today: string): LoadResult {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) {
    return { state: seeded(today), wasCorrupt: false }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { state: seeded(today), wasCorrupt: true }
  }

  const validated = parseStoredState(parsed)
  if (validated === null) {
    return { state: seeded(today), wasCorrupt: true }
  }

  return { state: validated, wasCorrupt: false }
}

export function save(state: StoredState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
