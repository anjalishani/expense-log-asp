import { describe, expect, it } from 'vitest'
import { parseStoredState } from './schema'
import { expense } from '../test/fixtures'

describe('parseStoredState', () => {
  it('accepts a well-formed stored state', () => {
    const valid = { version: 1, expenses: [expense({})], limits: { '2026-08': 150_000 } }
    expect(parseStoredState(valid)).toEqual(valid)
  })

  it('accepts the empty state written by clear-all', () => {
    const empty = { version: 1, expenses: [], limits: {} }
    expect(parseStoredState(empty)).toEqual(empty)
  })

  it('rejects null', () => {
    expect(parseStoredState(null)).toBeNull()
  })

  it('rejects a non-object', () => {
    expect(parseStoredState('not an object')).toBeNull()
  })

  it('rejects a missing version', () => {
    expect(parseStoredState({ expenses: [], limits: {} })).toBeNull()
  })

  it('rejects an unsupported version', () => {
    expect(parseStoredState({ version: 2, expenses: [], limits: {} })).toBeNull()
  })

  it('rejects a non-array expenses field', () => {
    expect(parseStoredState({ version: 1, expenses: {}, limits: {} })).toBeNull()
  })

  it('rejects an expense missing a required field', () => {
    const bad = { ...expense({}) } as Record<string, unknown>
    delete bad.amount
    expect(parseStoredState({ version: 1, expenses: [bad], limits: {} })).toBeNull()
  })

  it('rejects an expense with a non-positive amount', () => {
    const bad = expense({ amount: 0 })
    expect(parseStoredState({ version: 1, expenses: [bad], limits: {} })).toBeNull()
  })

  it('rejects a non-object limits field', () => {
    expect(parseStoredState({ version: 1, expenses: [], limits: [] })).toBeNull()
  })

  it('rejects a limits value that is not a number', () => {
    expect(
      parseStoredState({ version: 1, expenses: [], limits: { '2026-08': '150000' } }),
    ).toBeNull()
  })
})
