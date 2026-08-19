import { categoryTotals } from '../domain/expenses'
import { formatMinorUnits } from '../domain/money'
import type { Expense } from '../domain/types'

type Props = {
  expenses: Expense[]
}

export function CategoryTotals({ expenses }: Props) {
  const totals = categoryTotals(expenses)

  if (totals.length === 0) {
    return <p>No spending this month.</p>
  }

  return (
    <ul aria-label="Category totals">
      {totals.map((row) => (
        <li key={row.category}>
          <span>{row.category}</span>
          <span>{formatMinorUnits(row.total)}</span>
        </li>
      ))}
    </ul>
  )
}
