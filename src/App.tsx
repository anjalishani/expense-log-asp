import { useReducer } from 'react'
import { BudgetSummary } from './components/BudgetSummary'
import { CategoryTotals } from './components/CategoryTotals'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { MonthNavigator } from './components/MonthNavigator'
import { reducer, type ExpenseState } from './state/reducer'
import { currentMonthKey } from './state/currentMonth'
import { expensesInMonth, monthTotal } from './domain/expenses'
import { resolveLimit } from './domain/limits'
import type { Expense, MonthKey } from './domain/types'

function createInitialState(): ExpenseState {
  return { expenses: [], selectedMonth: currentMonthKey(), limits: {} }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  function handleAdd(expense: Expense) {
    dispatch({ type: 'ADD_EXPENSE', expense })
  }

  function handleSelectMonth(month: MonthKey) {
    dispatch({ type: 'SELECT_MONTH', month })
  }

  function handleSetLimit(amount: number) {
    dispatch({ type: 'SET_LIMIT', month: state.selectedMonth, amount })
  }

  const monthExpenses = expensesInMonth(state.expenses, state.selectedMonth)

  return (
    <main>
      <h1>Expense Log</h1>
      <MonthNavigator month={state.selectedMonth} onChange={handleSelectMonth} />
      <ExpenseForm onAdd={handleAdd} />
      <ExpenseList expenses={monthExpenses} />
      <CategoryTotals expenses={monthExpenses} />
      <BudgetSummary
        key={state.selectedMonth}
        limit={resolveLimit(state.limits, state.selectedMonth)}
        spent={monthTotal(monthExpenses)}
        onSetLimit={handleSetLimit}
      />
    </main>
  )
}
