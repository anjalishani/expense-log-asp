import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { currentMonthKey } from './state/currentMonth'
import { nextMonth } from './domain/month'

function todayIsoDate(): string {
  // Single Date instant: currentMonthKey() would call `new Date()` again for
  // the year/month half, which can race across a month boundary and produce
  // an invalid composite date (e.g. "2026-09-31").
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

async function addExpense(
  user: ReturnType<typeof userEvent.setup>,
  date: string,
  amount: string,
  category: string,
) {
  await user.type(screen.getByLabelText('Date'), date)
  await user.type(screen.getByLabelText('Amount'), amount)
  await user.selectOptions(screen.getByLabelText('Category'), category)
  await user.click(screen.getByRole('button', { name: 'Add expense' }))
}

describe('App', () => {
  it('adds an expense through the form and shows it in the list', async () => {
    const user = userEvent.setup()
    render(<App />)
    const today = todayIsoDate()

    expect(screen.getByText('No expenses this month.')).toBeInTheDocument()

    await addExpense(user, today, '12.34', 'Groceries')

    expect(screen.queryByText('No expenses this month.')).not.toBeInTheDocument()
    const list = within(screen.getByRole('list', { name: 'Expenses' }))
    expect(list.getByText(today)).toBeInTheDocument()
    expect(list.getByText('12.34')).toBeInTheDocument()
    expect(list.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toHaveValue('')
  })

  it('switches to the expense\'s month when it is logged outside the viewed month', async () => {
    const user = userEvent.setup()
    render(<App />)

    await addExpense(user, '2000-01-15', '12.34', 'Groceries')

    // Previously this entry would silently vanish because the list stayed on
    // the originally viewed month. It must now be visible where it was added.
    expect(screen.queryByText('No expenses this month.')).not.toBeInTheDocument()
    expect(screen.getByText('January 2000')).toBeInTheDocument()
    const list = within(screen.getByRole('list', { name: 'Expenses' }))
    expect(list.getByText('2000-01-15')).toBeInTheDocument()
  })

  it('follows the selected month when navigating with Previous/Next', async () => {
    const user = userEvent.setup()
    render(<App />)
    const thisMonth = currentMonthKey()
    const thisMonthDate = `${thisMonth}-10`
    const followingMonth = nextMonth(thisMonth)
    const followingMonthDate = `${followingMonth}-10`

    function expenseList() {
      return within(screen.getByRole('list', { name: 'Expenses' }))
    }

    await addExpense(user, thisMonthDate, '10.00', 'Groceries')
    expect(expenseList().getByText(thisMonthDate)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('No expenses this month.')).toBeInTheDocument()

    await addExpense(user, followingMonthDate, '20.00', 'Transport')
    expect(expenseList().getByText(followingMonthDate)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(expenseList().getByText(thisMonthDate)).toBeInTheDocument()
    expect(screen.queryByText(followingMonthDate)).not.toBeInTheDocument()
  })

  it('shows a per-category total that updates as expenses are added', async () => {
    const user = userEvent.setup()
    render(<App />)
    const today = todayIsoDate()

    expect(screen.getByText('No spending this month.')).toBeInTheDocument()

    await addExpense(user, today, '10.00', 'Groceries')
    await addExpense(user, today, '5.50', 'Groceries')
    await addExpense(user, today, '20.00', 'Transport')

    const totals = within(screen.getByRole('list', { name: 'Category totals' }))
    expect(totals.getByText('15.50')).toBeInTheDocument()
    expect(totals.getByText('20.00')).toBeInTheDocument()
    // Rent had no expenses this month, so it must not appear as a zero row.
    expect(totals.queryByText('Rent')).not.toBeInTheDocument()
    // The month total must equal the sum of the category totals shown above.
    expect(screen.getByTestId('month-total')).toHaveTextContent('35.50')
  })

  it('stores a limit against the viewed month only, surviving navigation away and back', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    // A different month must not inherit or see this month's explicit limit.
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })
})
