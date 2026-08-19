import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('adds an expense through the form and shows it in the list', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('No expenses yet.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Date'), '2026-08-19')
    await user.type(screen.getByLabelText('Amount'), '12.34')
    await user.selectOptions(screen.getByLabelText('Category'), 'Groceries')
    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.queryByText('No expenses yet.')).not.toBeInTheDocument()
    const list = within(screen.getByRole('list'))
    expect(list.getByText('2026-08-19')).toBeInTheDocument()
    expect(list.getByText('12.34')).toBeInTheDocument()
    expect(list.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toHaveValue('')
  })
})
