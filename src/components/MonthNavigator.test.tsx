import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthNavigator } from './MonthNavigator'

describe('MonthNavigator', () => {
  it('shows the selected month', () => {
    render(<MonthNavigator month="2026-08" onChange={vi.fn()} />)
    expect(screen.getByText('August 2026')).toBeInTheDocument()
  })

  it('moves to the next month when Next is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthNavigator month="2026-08" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(onChange).toHaveBeenCalledWith('2026-09')
  })

  it('moves to the previous month when Previous is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthNavigator month="2026-08" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(onChange).toHaveBeenCalledWith('2026-07')
  })

  it('crosses a year boundary going forward from December', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthNavigator month="2026-12" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(onChange).toHaveBeenCalledWith('2027-01')
  })
})
