import { useId, useState } from 'react'
import { formatMinorUnits, parseAmountToMinorUnits } from '../domain/money'

type Props = {
  limit: number | undefined
  onSetLimit: (amount: number) => void
}

export function BudgetSummary({ limit, onSetLimit }: Props) {
  const [value, setValue] = useState(limit === undefined ? '' : formatMinorUnits(limit))
  const limitId = useId()

  const result = parseAmountToMinorUnits(value)
  const error = value !== '' && !result.ok ? result.error : null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!result.ok) return
    onSetLimit(result.minorUnits)
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
      />
      {error && <span>{error}</span>}
      <button type="submit" disabled={!result.ok}>
        Set limit
      </button>
    </form>
  )
}
