import { useReducer } from 'react'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { reducer, type ExpenseState } from './state/reducer'
import type { Expense } from './domain/types'

const initialState: ExpenseState = { expenses: [] }

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  function handleAdd(expense: Expense) {
    dispatch({ type: 'ADD_EXPENSE', expense })
  }

  return (
    <main>
      <h1>Expense Log</h1>
      <ExpenseForm onAdd={handleAdd} />
      <ExpenseList expenses={state.expenses} />
    </main>
  )
}
