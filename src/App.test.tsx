import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { currentMonthKey } from './state/currentMonth'
import { nextMonth } from './domain/month'
import { STORAGE_KEY } from './storage/localStorage'

// Every test below is about component wiring, not persistence itself, so each
// starts from an explicit *empty* stored envelope rather than an absent key —
// an absent key would trigger seeding (story #21) and throw off every
// assertion here that expects a blank slate. Persistence and seeding get
// their own tests further down, which manage localStorage themselves.
beforeEach(() => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [], limits: {} }))
})

afterEach(() => {
  window.localStorage.clear()
})

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

    // An earlier month must never inherit a later month's limit (only carry-
    // forward, never carry-back).
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })

  it('does not silently discard an unsubmitted limit when adding an expense switches the month', async () => {
    const user = userEvent.setup()
    render(<App />)
    const thisMonth = currentMonthKey()
    const followingMonth = nextMonth(thisMonth)
    const followingMonthDate = `${followingMonth}-10`

    // Type a limit for the current month but never click "Set limit" — focus
    // moves to the expense form's Date field next, which blurs this input.
    await user.type(screen.getByLabelText('Monthly limit'), '1500')

    // Logging an expense dated in a different month auto-switches selectedMonth
    // (see reducer.ts ADD_EXPENSE), which remounts BudgetSummary. Per PR #43
    // review, this used to silently discard the unsubmitted "1500".
    await addExpense(user, followingMonthDate, '20.00', 'Groceries')

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })

  it('carries a limit forward into a later month with no explicit limit of its own', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')

    // An earlier month must never be rewritten by carry-forward display alone.
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })

  it('shows no inherited limit for a month before any limit was ever set', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('')
  })

  it('shows remaining budget that updates by exactly the added amount', async () => {
    const user = userEvent.setup()
    render(<App />)
    const today = todayIsoDate()

    await user.type(screen.getByLabelText('Monthly limit'), '150')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))
    expect(screen.getByTestId('remaining')).toHaveTextContent('150.00')

    await addExpense(user, today, '20.00', 'Groceries')
    expect(screen.getByTestId('remaining')).toHaveTextContent('130.00')
  })

  it('shows "no limit set" instead of a remaining figure when nothing resolves', () => {
    render(<App />)
    expect(screen.getByText('No limit set.')).toBeInTheDocument()
    expect(screen.queryByTestId('remaining')).not.toBeInTheDocument()
  })

  it('recalculates remaining for each month\'s own spend when navigating, not the previous month\'s', async () => {
    const user = userEvent.setup()
    render(<App />)
    const thisMonth = currentMonthKey()
    const thisMonthDate = `${thisMonth}-10`
    const followingMonth = nextMonth(thisMonth)
    const followingMonthDate = `${followingMonth}-10`

    // A limit set once carries forward, so both months resolve to the same 100.00.
    await user.type(screen.getByLabelText('Monthly limit'), '100')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    await addExpense(user, thisMonthDate, '30.00', 'Groceries')
    expect(screen.getByTestId('remaining')).toHaveTextContent('70.00')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    // The following month has no spend of its own yet: remaining must reflect
    // its own (carried-forward) limit, not the previous month's spend.
    expect(screen.getByTestId('remaining')).toHaveTextContent('100.00')

    await addExpense(user, followingMonthDate, '40.00', 'Transport')
    expect(screen.getByTestId('remaining')).toHaveTextContent('60.00')

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    // Back on the original month, remaining must reflect its own spend again,
    // not the following month's.
    expect(screen.getByTestId('remaining')).toHaveTextContent('70.00')
  })

  describe('persistence', () => {
    it('seeds example data on a genuinely first run (no stored key at all)', () => {
      window.localStorage.clear() // undo the beforeEach's empty envelope
      render(<App />)

      // Seeded current-month spend is exactly €1,180.00 against a €1,500.00
      // limit (spec §6), so remaining must read exactly €320.00.
      expect(screen.getByTestId('remaining')).toHaveTextContent('320.00')
    })

    it('hydrates expenses and limits from previously saved storage', () => {
      const today = todayIsoDate()
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          expenses: [{ id: 'a', date: today, amount: 5000, category: 'Groceries' }],
          limits: { [currentMonthKey()]: 10000 },
        }),
      )

      render(<App />)

      const list = within(screen.getByRole('list', { name: 'Expenses' }))
      expect(list.getByText('50.00')).toBeInTheDocument()
      expect(screen.getByTestId('remaining')).toHaveTextContent('50.00')
    })

    it('persists an added expense so it survives a fresh mount', async () => {
      const user = userEvent.setup()
      const today = todayIsoDate()
      const { unmount } = render(<App />)

      await addExpense(user, today, '12.34', 'Groceries')
      unmount()

      render(<App />)
      const list = within(screen.getByRole('list', { name: 'Expenses' }))
      expect(list.getByText('12.34')).toBeInTheDocument()
    })

    it('recovers with seed data and a dismissible notice when stored data is corrupt', async () => {
      const user = userEvent.setup()
      window.localStorage.setItem(STORAGE_KEY, '{not valid json')

      render(<App />)

      expect(screen.getByTestId('storage-recovery-notice')).toBeInTheDocument()
      expect(screen.getByTestId('remaining')).toHaveTextContent('320.00')

      await user.click(screen.getByRole('button', { name: 'Dismiss' }))
      expect(screen.queryByTestId('storage-recovery-notice')).not.toBeInTheDocument()
    })
  })

  describe('clear all data', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('clears expenses and limits once the confirmation is accepted', async () => {
      const user = userEvent.setup()
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const today = todayIsoDate()
      render(<App />)

      await addExpense(user, today, '12.34', 'Groceries')
      await user.type(screen.getByLabelText('Monthly limit'), '150')
      await user.click(screen.getByRole('button', { name: 'Set limit' }))

      await user.click(screen.getByRole('button', { name: 'Clear all data' }))

      expect(screen.getByText('No expenses this month.')).toBeInTheDocument()
      expect(screen.getByText('No limit set.')).toBeInTheDocument()
    })

    it('does not clear when the confirmation is declined', async () => {
      const user = userEvent.setup()
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const today = todayIsoDate()
      render(<App />)

      await addExpense(user, today, '12.34', 'Groceries')
      await user.click(screen.getByRole('button', { name: 'Clear all data' }))

      const list = within(screen.getByRole('list', { name: 'Expenses' }))
      expect(list.getByText('12.34')).toBeInTheDocument()
    })

    it('stays empty after clearing and a fresh mount, rather than re-seeding', async () => {
      const user = userEvent.setup()
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      window.localStorage.clear() // start from a genuine first run, seeded
      const { unmount } = render(<App />)

      await user.click(screen.getByRole('button', { name: 'Clear all data' }))
      unmount()

      render(<App />)
      expect(screen.getByText('No expenses this month.')).toBeInTheDocument()
      expect(screen.getByText('No limit set.')).toBeInTheDocument()
    })
  })
})
