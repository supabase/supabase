import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet'

const TestSheet = ({ tabIndex }: { tabIndex?: number }) => {
  const tabIndexProps = tabIndex === undefined ? {} : { tabIndex }

  return (
    <Sheet open>
      <SheetContent {...tabIndexProps}>
        <SheetTitle>Sheet title</SheetTitle>
        <SheetDescription>Sheet description</SheetDescription>
        <input aria-label="First field" />
      </SheetContent>
    </Sheet>
  )
}

describe('SheetContent', () => {
  it('focuses its first interactive child without making the sheet focusable', async () => {
    render(<TestSheet />)

    const sheet = screen.getByRole('dialog')
    const input = screen.getByRole('textbox', { name: 'First field' })

    await waitFor(() => expect(input).toHaveFocus())
    expect(sheet).not.toHaveAttribute('tabindex')
  })

  it('allows the sheet to be made programmatically focusable explicitly', () => {
    render(<TestSheet tabIndex={-1} />)

    expect(screen.getByRole('dialog')).toHaveAttribute('tabindex', '-1')
  })

  it('does not move focus to the sheet when a focused child is removed', async () => {
    const renderSheet = (showFirstButton: boolean) => (
      <Sheet open>
        <SheetContent>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
          {showFirstButton && <button>Remove me</button>}
          <input aria-label="Remaining field" />
        </SheetContent>
      </Sheet>
    )
    const { rerender } = render(renderSheet(true))
    const button = screen.getByRole('button', { name: 'Remove me' })

    await waitFor(() => expect(button).toHaveFocus())
    rerender(renderSheet(false))

    await waitFor(() => expect(button).not.toBeInTheDocument())
    await new Promise<void>((resolve) => queueMicrotask(resolve))
    expect(screen.getByRole('dialog')).not.toHaveFocus()
  })
})
