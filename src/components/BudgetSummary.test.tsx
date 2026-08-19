import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetSummary } from './BudgetSummary'

describe('BudgetSummary', () => {
  it('sets a limit on valid submit', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={undefined} onSetLimit={onSetLimit} />)

    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    expect(onSetLimit).toHaveBeenCalledTimes(1)
    expect(onSetLimit).toHaveBeenCalledWith(150000)
  })

  it('pre-fills the input with the current month\'s explicit limit', () => {
    render(<BudgetSummary limit={150000} onSetLimit={vi.fn()} />)
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })

  it('leaves the input blank when there is no limit for the month', () => {
    render(<BudgetSummary limit={undefined} onSetLimit={vi.fn()} />)
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('')
  })

  it('rejects a zero limit inline and blocks submit, without calling onSetLimit', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={undefined} onSetLimit={onSetLimit} />)

    await user.type(screen.getByLabelText('Monthly limit'), '0')

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set limit' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Set limit' }))
    expect(onSetLimit).not.toHaveBeenCalled()
  })

  it('rejects invalid input without discarding the existing limit', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={150000} onSetLimit={onSetLimit} />)

    await user.clear(screen.getByLabelText('Monthly limit'))
    await user.type(screen.getByLabelText('Monthly limit'), 'abc')

    expect(screen.getByRole('button', { name: 'Set limit' })).toBeDisabled()
    expect(onSetLimit).not.toHaveBeenCalled()
  })

  it('commits a valid value on blur, without needing an explicit submit click', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(
      <>
        <BudgetSummary limit={undefined} onSetLimit={onSetLimit} />
        <button type="button">Elsewhere</button>
      </>,
    )

    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))

    expect(onSetLimit).toHaveBeenCalledTimes(1)
    expect(onSetLimit).toHaveBeenCalledWith(150000)
  })

  it('does not commit on blur when the input is invalid', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(
      <>
        <BudgetSummary limit={undefined} onSetLimit={onSetLimit} />
        <button type="button">Elsewhere</button>
      </>,
    )

    await user.type(screen.getByLabelText('Monthly limit'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))

    expect(onSetLimit).not.toHaveBeenCalled()
  })

  it('reformats the displayed value to canonical form after a successful submit', async () => {
    const user = userEvent.setup()
    render(<BudgetSummary limit={undefined} onSetLimit={vi.fn()} />)

    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })

  it('commits a pre-filled (e.g. carried-forward) value on submit, unedited', async () => {
    // PR #44 review: seeding the duplicate-dispatch guard with the initial
    // prop made submitting an inherited value a silent no-op.
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={150000} onSetLimit={onSetLimit} />)

    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    expect(onSetLimit).toHaveBeenCalledTimes(1)
    expect(onSetLimit).toHaveBeenCalledWith(150000)
  })
})
