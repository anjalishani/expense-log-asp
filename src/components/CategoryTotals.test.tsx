import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryTotals } from './CategoryTotals'
import type { Expense } from '../domain/types'

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: '1',
    date: '2026-08-01',
    amount: 100,
    category: 'Groceries',
    ...overrides,
  }
}

describe('CategoryTotals', () => {
  it('shows an empty state when there are no expenses', () => {
    render(<CategoryTotals expenses={[]} />)
    expect(screen.getByText('No spending this month.')).toBeInTheDocument()
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
})
