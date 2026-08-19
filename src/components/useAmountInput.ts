import { useState } from 'react'
import { parseAmountToMinorUnits, type ParseAmountResult } from '../domain/money'

export type UseAmountInput = {
  value: string
  setValue: (value: string) => void
  result: ParseAmountResult
  error: string | null
}

export function useAmountInput(initialValue = ''): UseAmountInput {
  const [value, setValue] = useState(initialValue)
  const result = parseAmountToMinorUnits(value)
  const error = value !== '' && !result.ok ? result.error : null
  return { value, setValue, result, error }
}
