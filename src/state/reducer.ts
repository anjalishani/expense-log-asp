import type { Expense } from '../domain/types'

export type ExpenseState = {
  expenses: Expense[]
}

export type Action = { type: 'ADD_EXPENSE'; expense: Expense }

export function reducer(state: ExpenseState, action: Action): ExpenseState {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.expense] }
  }
}
