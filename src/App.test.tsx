import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

function todayIsoDate(): string {
  // Single Date instant: currentMonthKey() would call `new Date()` again for
  // the year/month half, which can race across a month boundary and produce
  // an invalid composite date (e.g. "2026-09-31").
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

describe('App', () => {
  it('adds an expense through the form and shows it in the list', async () => {
    const user = userEvent.setup()
    render(<App />)
    const today = todayIsoDate()

    expect(screen.getByText('No expenses this month.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Date'), today)
    await user.type(screen.getByLabelText('Amount'), '12.34')
    await user.selectOptions(screen.getByLabelText('Category'), 'Groceries')
    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.queryByText('No expenses this month.')).not.toBeInTheDocument()
    const list = within(screen.getByRole('list'))
    expect(list.getByText(today)).toBeInTheDocument()
    expect(list.getByText('12.34')).toBeInTheDocument()
    expect(list.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toHaveValue('')
  })

  it('does not show an expense logged in a different month', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Date'), '2000-01-15')
    await user.type(screen.getByLabelText('Amount'), '12.34')
    await user.selectOptions(screen.getByLabelText('Category'), 'Groceries')
    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.getByText('No expenses this month.')).toBeInTheDocument()
    expect(screen.queryByText('2000-01-15')).not.toBeInTheDocument()
  })
})
