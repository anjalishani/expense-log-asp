import { nextMonth, previousMonth } from '../domain/month'
import type { MonthKey } from '../domain/types'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type Props = {
  month: MonthKey
  onChange: (month: MonthKey) => void
}

function formatMonthLabel(month: MonthKey): string {
  const year = month.slice(0, 4)
  const monthIndex = Number(month.slice(5, 7)) - 1
  return `${MONTH_NAMES[monthIndex]} ${year}`
}

export function MonthNavigator({ month, onChange }: Props) {
  return (
    <div>
      <button type="button" onClick={() => onChange(previousMonth(month))}>
        Previous
      </button>
      <span>{formatMonthLabel(month)}</span>
      <button type="button" onClick={() => onChange(nextMonth(month))}>
        Next
      </button>
    </div>
  )
}
