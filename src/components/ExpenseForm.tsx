import { useId, useState } from 'react'
import { parseAmountToMinorUnits } from '../domain/money'
import { CATEGORIES, type Category, type Expense } from '../domain/types'

type Props = {
  onAdd: (expense: Expense) => void
}

export function ExpenseForm({ onAdd }: Props) {
  const [date, setDate] = useState('')
  const [dateTouched, setDateTouched] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const dateId = useId()
  const amountId = useId()
  const categoryId = useId()

  const amountResult = parseAmountToMinorUnits(amount)
  const amountError = amount !== '' && !amountResult.ok ? amountResult.error : null
  const dateError = dateTouched && date === '' ? 'Date is required' : null
  const isValid = amountResult.ok && date !== '' && category !== ''

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isValid) return

    onAdd({
      id: crypto.randomUUID(),
      date,
      amount: amountResult.ok ? amountResult.minorUnits : 0,
      category,
    })

    setDate('')
    setDateTouched(false)
    setAmount('')
    setCategory('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={dateId}>Date</label>
      <input
        id={dateId}
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        onBlur={() => setDateTouched(true)}
      />
      {dateError && <span>{dateError}</span>}

      <label htmlFor={amountId}>Amount</label>
      <input
        id={amountId}
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      {amountError && <span>{amountError}</span>}

      <label htmlFor={categoryId}>Category</label>
      <select
        id={categoryId}
        value={category}
        onChange={(event) => setCategory(event.target.value as Category)}
      >
        <option value="" disabled>
          Select a category
        </option>
        {CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button type="submit" disabled={!isValid}>
        Add expense
      </button>
    </form>
  )
}
