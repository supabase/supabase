import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Input } from './Input'

const { mockCopyToClipboard } = vi.hoisted(() => ({ mockCopyToClipboard: vi.fn() }))
vi.mock('ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ui')>()),
  copyToClipboard: mockCopyToClipboard,
}))

describe('Input copy and reveal callbacks', () => {
  beforeEach(() => {
    mockCopyToClipboard.mockReset()
    // Mirror the real helper: the callback runs once the clipboard write succeeds
    mockCopyToClipboard.mockImplementation((_text: string, onSuccess?: () => void) => onSuccess?.())
  })

  it('calls onCopied only after the Copy button writes to the clipboard', () => {
    const onCopied = vi.fn()
    render(<Input readOnly copy value="secret" onChange={() => {}} onCopied={onCopied} />)

    fireEvent.click(screen.getByRole('button', { name: /Copy/ }))

    expect(mockCopyToClipboard).toHaveBeenCalledWith('secret', expect.any(Function))
    expect(onCopied).toHaveBeenCalledTimes(1)
  })

  it('does not call onCopied when the clipboard write does not succeed', () => {
    mockCopyToClipboard.mockImplementation(() => {})
    const onCopied = vi.fn()
    render(<Input readOnly copy value="secret" onChange={() => {}} onCopied={onCopied} />)

    fireEvent.click(screen.getByRole('button', { name: /Copy/ }))

    expect(onCopied).not.toHaveBeenCalled()
  })

  it('does not call onCopied for a native copy event on the input', () => {
    const onCopied = vi.fn()
    const onCopy = vi.fn()
    render(
      <Input readOnly copy value="secret" onChange={() => {}} onCopy={onCopy} onCopied={onCopied} />
    )

    fireEvent.copy(screen.getByDisplayValue('secret'))

    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onCopied).not.toHaveBeenCalled()
  })

  it('calls onReveal when the Reveal button is clicked', () => {
    const onReveal = vi.fn()
    render(<Input readOnly reveal copy value="secret" onChange={() => {}} onReveal={onReveal} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reveal' }))

    expect(onReveal).toHaveBeenCalledTimes(1)
  })
})
