import { formatMinorUnits } from '../domain/money'
import type { Expense } from '../domain/types'

type Props = {
  expenses: Expense[]
}

export function ExpenseList({ expenses }: Props) {
  if (expenses.length === 0) {
    return <p>No expenses this month.</p>
  }

  return (
    <ul>
      {expenses.map((expense) => (
        <li key={expense.id}>
          <span>{expense.date}</span>
          <span>{formatMinorUnits(expense.amount)}</span>
          <span>{expense.category}</span>
        </li>
      ))}
    </ul>
  )
}
