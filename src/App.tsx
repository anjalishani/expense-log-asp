import { useEffect, useReducer, useState } from 'react'
import { BudgetSummary } from './components/BudgetSummary'
import { CategoryTotals } from './components/CategoryTotals'
import { ClearDataButton } from './components/ClearDataButton'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { MonthNavigator } from './components/MonthNavigator'
import { StorageRecoveryNotice } from './components/StorageRecoveryNotice'
import { reducer, type ExpenseState } from './state/reducer'
import { currentMonthKey, today } from './state/currentMonth'
import { expensesInMonth, monthTotal } from './domain/expenses'
import { resolveLimit } from './domain/limits'
import { load, save } from './storage/localStorage'
import type { Expense, MonthKey, StoredState } from './domain/types'

function createInitialState(loaded: StoredState): ExpenseState {
  return { expenses: loaded.expenses, selectedMonth: currentMonthKey(), limits: loaded.limits }
}

export default function App() {
  // Read once per mount: the lazy useReducer initializer below and the
  // recovery-notice flag both need this same load() result, and calling it
  // twice would be a second localStorage read for no benefit.
  const [initial] = useState(() => load(today()))
  const [state, dispatch] = useReducer(reducer, initial.state, createInitialState)
  const [showRecoveryNotice, setShowRecoveryNotice] = useState(initial.wasCorrupt)

  // Persists on every change, including the very first render — that first
  // write is what turns an absent storage key into a present one (seed data
  // or recovered data), satisfying "seed only when the key is absent" without
  // a separate first-run code path.
  useEffect(() => {
    save({ version: 1, expenses: state.expenses, limits: state.limits })
  }, [state.expenses, state.limits])

  function handleAdd(expense: Expense) {
    dispatch({ type: 'ADD_EXPENSE', expense })
  }

  function handleSelectMonth(month: MonthKey) {
    dispatch({ type: 'SELECT_MONTH', month })
  }

  function handleSetLimit(amount: number) {
    dispatch({ type: 'SET_LIMIT', month: state.selectedMonth, amount })
  }

  function handleClearAll() {
    dispatch({ type: 'CLEAR_ALL' })
  }

  const monthExpenses = expensesInMonth(state.expenses, state.selectedMonth)

  return (
    <main>
      <h1>Expense Log</h1>
      {showRecoveryNotice && (
        <StorageRecoveryNotice onDismiss={() => setShowRecoveryNotice(false)} />
      )}
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
      <ClearDataButton onClear={handleClearAll} />
    </main>
  )
}
