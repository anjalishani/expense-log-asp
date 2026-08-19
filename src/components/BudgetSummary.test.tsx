import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetSummary } from './BudgetSummary'

describe('BudgetSummary', () => {
  it('sets a limit on valid submit', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={undefined} onSetLimit={onSetLimit} spent={0} />)

    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    expect(onSetLimit).toHaveBeenCalledTimes(1)
    expect(onSetLimit).toHaveBeenCalledWith(150000)
  })

  it('pre-fills the input with the current month\'s explicit limit', () => {
    render(<BudgetSummary limit={150000} onSetLimit={vi.fn()} spent={0} />)
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })

  it('leaves the input blank when there is no limit for the month', () => {
    render(<BudgetSummary limit={undefined} onSetLimit={vi.fn()} spent={0} />)
    expect(screen.getByLabelText('Monthly limit')).toHaveValue('')
  })

  it('rejects a zero limit inline and blocks submit, without calling onSetLimit', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={undefined} onSetLimit={onSetLimit} spent={0} />)

    await user.type(screen.getByLabelText('Monthly limit'), '0')

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set limit' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Set limit' }))
    expect(onSetLimit).not.toHaveBeenCalled()
  })

  it('rejects invalid input without discarding the existing limit', async () => {
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={150000} onSetLimit={onSetLimit} spent={0} />)

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
        <BudgetSummary limit={undefined} onSetLimit={onSetLimit} spent={0} />
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
        <BudgetSummary limit={undefined} onSetLimit={onSetLimit} spent={0} />
        <button type="button">Elsewhere</button>
      </>,
    )

    await user.type(screen.getByLabelText('Monthly limit'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))

    expect(onSetLimit).not.toHaveBeenCalled()
  })

  it('reformats the displayed value to canonical form after a successful submit', async () => {
    const user = userEvent.setup()
    render(<BudgetSummary limit={undefined} onSetLimit={vi.fn()} spent={0} />)

    await user.type(screen.getByLabelText('Monthly limit'), '1500')
    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    expect(screen.getByLabelText('Monthly limit')).toHaveValue('1500.00')
  })

  it('commits a pre-filled (e.g. carried-forward) value on submit, unedited', async () => {
    // PR #44 review: seeding the duplicate-dispatch guard with the initial
    // prop made submitting an inherited value a silent no-op.
    const user = userEvent.setup()
    const onSetLimit = vi.fn()
    render(<BudgetSummary limit={150000} onSetLimit={onSetLimit} spent={0} />)

    await user.click(screen.getByRole('button', { name: 'Set limit' }))

    expect(onSetLimit).toHaveBeenCalledTimes(1)
    expect(onSetLimit).toHaveBeenCalledWith(150000)
  })

  it('shows the limit minus spend as the remaining amount', () => {
    render(<BudgetSummary limit={150000} onSetLimit={vi.fn()} spent={118000} />)
    expect(screen.getByTestId('remaining')).toHaveTextContent('320.00')
  })

  it('recalculates remaining immediately when spend changes', () => {
    const { rerender } = render(
      <BudgetSummary limit={150000} onSetLimit={vi.fn()} spent={118000} />,
    )
    expect(screen.getByTestId('remaining')).toHaveTextContent('320.00')

    rerender(<BudgetSummary limit={150000} onSetLimit={vi.fn()} spent={130000} />)
    expect(screen.getByTestId('remaining')).toHaveTextContent('200.00')
  })

  it('shows zero remaining, not negative, right at the limit', () => {
    render(<BudgetSummary limit={150000} onSetLimit={vi.fn()} spent={150000} />)
    expect(screen.getByTestId('remaining')).toHaveTextContent('0.00')
  })

  it('shows a negative remaining amount once spend exceeds the limit', () => {
    render(<BudgetSummary limit={150000} onSetLimit={vi.fn()} spent={150001} />)
    expect(screen.getByTestId('remaining')).toHaveTextContent('-0.01')
  })

  it('replaces the remaining figure with a "no limit set" message when there is no resolved limit', () => {
    render(<BudgetSummary limit={undefined} onSetLimit={vi.fn()} spent={5000} />)
    expect(screen.getByText('No limit set.')).toBeInTheDocument()
    expect(screen.queryByTestId('remaining')).not.toBeInTheDocument()
  })
})
