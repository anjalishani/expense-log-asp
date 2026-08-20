import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StorageRecoveryNotice } from './StorageRecoveryNotice'

describe('StorageRecoveryNotice', () => {
  it('renders with a stable test hook', () => {
    render(<StorageRecoveryNotice onDismiss={vi.fn()} />)
    expect(screen.getByTestId('storage-recovery-notice')).toBeInTheDocument()
  })

  it('calls onDismiss when dismissed', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<StorageRecoveryNotice onDismiss={onDismiss} />)

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
