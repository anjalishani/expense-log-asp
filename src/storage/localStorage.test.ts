import { beforeEach, describe, expect, it } from 'vitest'
import { load, save, STORAGE_KEY } from './localStorage'
import type { StoredState } from '../domain/types'
import { expense } from '../test/fixtures'

describe('storage/localStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('load', () => {
    it('returns seed data when the key is absent', () => {
      const result = load('2026-08-15')
      expect(result.wasCorrupt).toBe(false)
      expect(result.state.expenses.length).toBeGreaterThan(0)
    })

    it('does not write to storage itself', () => {
      load('2026-08-15')
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('returns previously saved state unchanged', () => {
      const stored: StoredState = { version: 1, expenses: [expense({})], limits: { '2026-08': 150_000 } }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

      const result = load('2026-08-15')

      expect(result.wasCorrupt).toBe(false)
      expect(result.state).toEqual(stored)
    })

    it('returns the empty state written by clear-all rather than reseeding', () => {
      const empty: StoredState = { version: 1, expenses: [], limits: {} }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(empty))

      const result = load('2026-08-15')

      expect(result.wasCorrupt).toBe(false)
      expect(result.state).toEqual(empty)
    })

    it('falls back to seed data and flags corruption on unparsable JSON', () => {
      window.localStorage.setItem(STORAGE_KEY, '{not valid json')

      const result = load('2026-08-15')

      expect(result.wasCorrupt).toBe(true)
      expect(result.state.expenses.length).toBeGreaterThan(0)
    })

    it('falls back to seed data and flags corruption on an unsupported version', () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, expenses: [], limits: {} }))

      const result = load('2026-08-15')

      expect(result.wasCorrupt).toBe(true)
      expect(result.state.expenses.length).toBeGreaterThan(0)
    })
  })

  describe('save', () => {
    it('writes the exact state under the storage key', () => {
      const state: StoredState = { version: 1, expenses: [expense({})], limits: { '2026-08': 150_000 } }
      save(state)
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual(state)
    })

    it('overwrites whatever was previously stored', () => {
      save({ version: 1, expenses: [expense({})], limits: {} })
      save({ version: 1, expenses: [], limits: {} })
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual({
        version: 1,
        expenses: [],
        limits: {},
      })
    })
  })
})
