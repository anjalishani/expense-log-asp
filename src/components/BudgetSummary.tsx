import { useId, useRef } from 'react'
import { useAmountInput } from './useAmountInput'
import { formatMinorUnits } from '../domain/money'

type Props = {
  limit: number | undefined
  spent: number
  onSetLimit: (amount: number) => void
}

export function BudgetSummary({ limit, spent, onSetLimit }: Props) {
  const { value, setValue, result, error } = useAmountInput(
    limit === undefined ? '' : formatMinorUnits(limit),
  )
  const limitId = useId()
  // Both a blur and the resulting submit can fire for one button click
  // (focus leaves the input before the click handler runs); track the last
  // amount committed *by this component* so that sequence doesn't call
  // onSetLimit twice. Seeding this with the initial `limit` prop instead of
  // `undefined` was a bug (PR #44 review): it made submitting a pre-filled
  // carry-forward value, unedited, a silent no-op, since it looked identical
  // to an already-committed value.
  const lastCommitted = useRef<number | undefined>(undefined)

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
      {limit === undefined ? (
        <p>No limit set.</p>
      ) : (
        <p data-testid="remaining">Remaining: {formatMinorUnits(limit - spent)}</p>
      )}
      {limit !== undefined && spent > limit && (
        <p role="alert" data-testid="over-limit-warning">
          You've gone over your monthly limit.
        </p>
      )}
    </form>
  )
}
