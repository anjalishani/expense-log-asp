import { useReducer } from 'react'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { MonthNavigator } from './components/MonthNavigator'
import { reducer, type ExpenseState } from './state/reducer'
import { currentMonthKey } from './state/currentMonth'
import { expensesInMonth } from './domain/expenses'
import type { Expense, MonthKey } from './domain/types'

function createInitialState(): ExpenseState {
  return { expenses: [], selectedMonth: currentMonthKey() }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  function handleAdd(expense: Expense) {
    dispatch({ type: 'ADD_EXPENSE', expense })
  }

  function handleSelectMonth(month: MonthKey) {
    dispatch({ type: 'SELECT_MONTH', month })
  }

  return (
    <main>
      <h1>Expense Log</h1>
      <MonthNavigator month={state.selectedMonth} onChange={handleSelectMonth} />
      <ExpenseForm onAdd={handleAdd} />
      <ExpenseList expenses={expensesInMonth(state.expenses, state.selectedMonth)} />
    </main>
  )
}
