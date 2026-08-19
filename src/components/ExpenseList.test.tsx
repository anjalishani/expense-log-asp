import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpenseList } from './ExpenseList'
import type { Expense } from '../domain/types'

describe('ExpenseList', () => {
  it('shows an empty state when there are no expenses', () => {
    render(<ExpenseList expenses={[]} />)
    expect(screen.getByText('No expenses this month.')).toBeInTheDocument()
  })

  it('lists a submitted expense', () => {
    const expense: Expense = {
      id: '1',
      date: '2026-08-19',
      amount: 1234,
      category: 'Groceries',
    }
    render(<ExpenseList expenses={[expense]} />)

    expect(screen.getByText('2026-08-19')).toBeInTheDocument()
    expect(screen.getByText('12.34')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })
})
