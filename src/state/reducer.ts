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
      return { ...state, expenses: [...state.expenses, action.expense] }
    case 'SELECT_MONTH':
      return { ...state, selectedMonth: action.month }
  }
}
