import type { Expense, MonthKey } from '../domain/types'

export type ExpenseState = {
  expenses: Expense[]
  selectedMonth: MonthKey
}

export type Action =
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'SELECT_MONTH'; month: MonthKey }

export function reducer(state: ExpenseState, action: Action): ExpenseState {
  switch (action.type) {
    case 'ADD_EXPENSE':
      // Switch to the added expense's month so it's always visible right after
      // submission. Without this, adding an expense while viewing a different
      // month silently drops it from the list with no feedback (PR #40 review).
      return {
        ...state,
        expenses: [...state.expenses, action.expense],
        selectedMonth: action.expense.date.slice(0, 7),
      }
    case 'SELECT_MONTH':
      return { ...state, selectedMonth: action.month }
  }
}
