import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryTotals } from './CategoryTotals'
import { expense } from '../test/fixtures'

describe('CategoryTotals', () => {
  it('shows an empty state when there are no expenses', () => {
    render(<CategoryTotals expenses={[]} />)
    expect(screen.getByTestId('no-spending')).toHaveTextContent('No spending this month.')
  })

  it('shows one row per category with a non-zero total', () => {
    render(
      <CategoryTotals
        expenses={[
          expense({ id: '1', category: 'Groceries', amount: 100 }),
          expense({ id: '2', category: 'Groceries', amount: 250 }),
          expense({ id: '3', category: 'Transport', amount: 500 }),
        ]}
      />,
    )

    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('3.50')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('5.00')).toBeInTheDocument()
  })

  it('omits categories with no expenses', () => {
    render(<CategoryTotals expenses={[expense({ category: 'Rent', amount: 1000 })]} />)

    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
    expect(screen.queryByText('Transport')).not.toBeInTheDocument()
  })

  it('exposes a stable data-testid per category row, per the design spec', () => {
    render(<CategoryTotals expenses={[expense({ category: 'Groceries', amount: 100 })]} />)

    expect(screen.getByTestId('category-total-Groceries')).toHaveTextContent('1.00')
  })

  it('shows a month total, under data-testid="month-total", equal to the sum of category totals', () => {
    render(
      <CategoryTotals
        expenses={[
          expense({ id: '1', category: 'Groceries', amount: 100 }),
          expense({ id: '2', category: 'Transport', amount: 500 }),
        ]}
      />,
    )

    expect(screen.getByTestId('month-total')).toHaveTextContent('6.00')
  })
})
