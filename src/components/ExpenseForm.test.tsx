import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseForm } from './ExpenseForm'
import { CATEGORIES } from '../domain/types'

describe('ExpenseForm', () => {
  it('offers the five fixed categories', () => {
    render(<ExpenseForm onAdd={vi.fn()} />)
    for (const category of CATEGORIES) {
      expect(screen.getByRole('option', { name: category })).toBeInTheDocument()
    }
  })

  it('adds an expense on valid submit and clears the form', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<ExpenseForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText('Date'), '2026-08-19')
    await user.type(screen.getByLabelText('Amount'), '12.34')
    await user.selectOptions(screen.getByLabelText('Category'), 'Groceries')
    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-08-19', amount: 1234, category: 'Groceries' }),
    )
    expect(screen.getByLabelText('Amount')).toHaveValue('')
    expect(screen.getByLabelText('Date')).toHaveValue('')
  })

  it('rejects a zero amount inline and blocks submit', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<ExpenseForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText('Date'), '2026-08-19')
    await user.type(screen.getByLabelText('Amount'), '0')
    await user.selectOptions(screen.getByLabelText('Category'), 'Groceries')

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('rejects a negative amount inline and blocks submit', async () => {
    const user = userEvent.setup()
    render(<ExpenseForm onAdd={vi.fn()} />)

    await user.type(screen.getByLabelText('Amount'), '-5')

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled()
  })

  it('blocks submit while the date is missing', async () => {
    const user = userEvent.setup()
    render(<ExpenseForm onAdd={vi.fn()} />)

    await user.type(screen.getByLabelText('Amount'), '12.34')
    await user.selectOptions(screen.getByLabelText('Category'), 'Groceries')

    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled()
  })

  it('blocks submit while no category is selected', async () => {
    const user = userEvent.setup()
    render(<ExpenseForm onAdd={vi.fn()} />)

    await user.type(screen.getByLabelText('Date'), '2026-08-19')
    await user.type(screen.getByLabelText('Amount'), '12.34')

    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled()
  })
})
