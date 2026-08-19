export type Category = 'Groceries' | 'Transport' | 'Rent' | 'Eating out' | 'Other'

export const CATEGORIES: readonly Category[] = [
  'Groceries',
  'Transport',
  'Rent',
  'Eating out',
  'Other',
]

export type MonthKey = string // 'YYYY-MM'

export type Expense = {
  id: string
  date: string // 'YYYY-MM-DD'
  amount: number // minor units, always > 0
  category: Category
}

export type Limits = Record<MonthKey, number> // minor units

export type BudgetStatus = 'no-limit' | 'under' | 'over'
