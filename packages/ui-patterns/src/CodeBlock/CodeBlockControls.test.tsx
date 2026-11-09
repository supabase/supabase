import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CodeBlockControls } from './CodeBlockControls'

const writeText = vi.fn<(text: string) => Promise<void>>()

const renderControls = () =>
  render(
    <TooltipProvider>
      <div className="shiki">
        <CodeBlockControls content="select 1" />
      </div>
    </TooltipProvider>
  )

describe('CodeBlockControls', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  it('copies the explicit source and announces success until blur', async () => {
    renderControls()
    const copy = screen.getByRole('button', { name: 'Copy code' })

    fireEvent.click(copy)

    await waitFor(() => expect(screen.getByText('Code copied')).toBeInTheDocument())
    expect(writeText).toHaveBeenCalledExactlyOnceWith('select 1')

    fireEvent.blur(copy)
    expect(screen.queryByText('Code copied')).toBeNull()
  })

  it('does not announce success when the clipboard write fails', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    renderControls()

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))

    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(screen.queryByText('Code copied')).toBeNull()
  })

  it('sets the wrap flag on a direct child of the frame and announces each change', () => {
    const { container } = renderControls()
    const frame = container.querySelector('.shiki')
    // code-block.css matches the frame with :has(> [data-wrapped='true'])
    const wrapFlag = () => frame?.querySelector(":scope > [data-wrapped='true']")

    fireEvent.click(screen.getByRole('button', { name: 'Enable word wrap' }))
    expect(wrapFlag()).not.toBeNull()
    expect(frame).not.toHaveAttribute('data-wrapped')
    expect(screen.getByText('Word wrap enabled')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Disable word wrap' }))
    expect(wrapFlag()).toBeNull()
    expect(screen.getByText('Word wrap disabled')).toBeInTheDocument()
  })
})
