import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClearDataButton } from './ClearDataButton'

describe('ClearDataButton', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('asks for confirmation before clearing', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onClear = vi.fn()
    render(<ClearDataButton onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: 'Clear all data' }))

    expect(confirmSpy).toHaveBeenCalledTimes(1)
  })

  it('clears when the confirmation is accepted', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onClear = vi.fn()
    render(<ClearDataButton onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: 'Clear all data' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('does not clear when the confirmation is declined', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onClear = vi.fn()
    render(<ClearDataButton onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: 'Clear all data' }))

    expect(onClear).not.toHaveBeenCalled()
  })
})
