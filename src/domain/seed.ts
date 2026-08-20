import { previousMonth } from './month'
import type { Category, Expense, Limits, MonthKey } from './types'

type SeedLine = { day: number; category: Category; amount: number }

// Nine hand-picked lines plus Rent absorbing the remainder so the total lands
// on exactly €1,180.00 (spec §6) without a suspiciously round Rent figure.
const CURRENT_MONTH_LINES: SeedLine[] = [
  { day: 2, category: 'Groceries', amount: 4200 },
  { day: 9, category: 'Groceries', amount: 3500 },
  { day: 21, category: 'Groceries', amount: 2900 },
  { day: 5, category: 'Transport', amount: 2600 },
  { day: 18, category: 'Transport', amount: 1900 },
  { day: 7, category: 'Eating out', amount: 3800 },
  { day: 15, category: 'Eating out', amount: 2700 },
  { day: 12, category: 'Other', amount: 1500 },
  { day: 25, category: 'Other', amount: 900 },
]
const NON_RENT_TOTAL = CURRENT_MONTH_LINES.reduce((sum, line) => sum + line.amount, 0)
const CURRENT_MONTH_TOTAL = 118_000
const RENT_LINE: SeedLine = { day: 1, category: 'Rent', amount: CURRENT_MONTH_TOTAL - NON_RENT_TOTAL }

const PREVIOUS_MONTH_LINES: SeedLine[] = [
  { day: 3, category: 'Groceries', amount: 4000 },
  { day: 19, category: 'Groceries', amount: 3000 },
  { day: 6, category: 'Transport', amount: 2200 },
  { day: 1, category: 'Rent', amount: 90_000 },
  { day: 14, category: 'Eating out', amount: 3300 },
  { day: 22, category: 'Other', amount: 1100 },
]

const CURRENT_MONTH_LIMIT = 150_000

function dateInMonth(month: MonthKey, day: number): string {
  return `${month}-${String(day).padStart(2, '0')}`
}

function toExpenses(month: MonthKey, lines: SeedLine[], idPrefix: string): Expense[] {
  return lines.map((line, index) => ({
    id: `${idPrefix}-${index}`,
    date: dateInMonth(month, line.day),
    amount: line.amount,
    category: line.category,
  }))
}

export function createSeedState(today: string): { expenses: Expense[]; limits: Limits } {
  const currentMonth = today.slice(0, 7)
  const lastMonth = previousMonth(currentMonth)

  return {
    expenses: [
      ...toExpenses(currentMonth, [...CURRENT_MONTH_LINES, RENT_LINE], 'seed-current'),
      ...toExpenses(lastMonth, PREVIOUS_MONTH_LINES, 'seed-previous'),
    ],
    limits: { [currentMonth]: CURRENT_MONTH_LIMIT },
  }
}
