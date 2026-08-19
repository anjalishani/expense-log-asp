import { useId, useRef } from 'react'
import { useAmountInput } from './useAmountInput'
import { formatMinorUnits } from '../domain/money'

type Props = {
  limit: number | undefined
  onSetLimit: (amount: number) => void
}

export function BudgetSummary({ limit, onSetLimit }: Props) {
  const { value, setValue, result, error } = useAmountInput(
    limit === undefined ? '' : formatMinorUnits(limit),
  )
  const limitId = useId()
  // Both a blur and the resulting submit can fire for one button click
  // (focus leaves the input before the click handler runs); track the last
  // committed amount so that sequence doesn't call onSetLimit twice.
  const lastCommitted = useRef(limit)

  function commit() {
    if (!result.ok || result.minorUnits === lastCommitted.current) return
    lastCommitted.current = result.minorUnits
    onSetLimit(result.minorUnits)
    setValue(formatMinorUnits(result.minorUnits))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    commit()
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={limitId}>Monthly limit</label>
      <input
        id={limitId}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
      />
      {error && <span>{error}</span>}
      <button type="submit" disabled={!result.ok}>
        Set limit
      </button>
    </form>
  )
}
