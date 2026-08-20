import { formatMonthLabel, nextMonth, previousMonth } from '../domain/month'
import type { MonthKey } from '../domain/types'

type Props = {
  month: MonthKey
  onChange: (month: MonthKey) => void
}

export function MonthNavigator({ month, onChange }: Props) {
  return (
    <div>
      <button type="button" onClick={() => onChange(previousMonth(month))}>
        Previous
      </button>
      <span data-testid="current-month">{formatMonthLabel(month)}</span>
      <button type="button" onClick={() => onChange(nextMonth(month))}>
        Next
      </button>
    </div>
  )
}
