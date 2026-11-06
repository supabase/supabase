import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CodeBlock } from './CodeBlock'

describe('CodeBlock', () => {
  it('highlights updated code and copies it with the latest callback', () => {
    const copy = vi.fn()
    const nextCopy = vi.fn()
    const { container, rerender } = render(
      <CodeBlock value="select 1" language="sql" className="p-2" handleCopy={copy} />
    )

    expect(container.querySelector('code')?.textContent).toContain('select 1')
    expect(screen.getByText('select', { selector: 'span' })).toHaveAttribute('style')
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(copy).toHaveBeenCalledWith('select 1')

    rerender(<CodeBlock value="select 2" language="sql" className="p-2" handleCopy={nextCopy} />)

    expect(container.querySelector('code')?.textContent).toContain('select 2')
    fireEvent.click(screen.getByRole('button', { name: 'Copied' }))
    expect(nextCopy).toHaveBeenCalledWith('select 2')
    expect(copy).toHaveBeenCalledTimes(1)
  })

  it('stops propagation of Shift+wheel events while allowing regular wheel events to bubble', () => {
    const onParentWheel = vi.fn()
    const { container } = render(
      <div onWheel={onParentWheel}>
        <CodeBlock value="const longLine = 1" language="ts" className="p-2" />
      </div>
    )

    const codeElement = container.querySelector('code')
    expect(codeElement).not.toBeNull()

    fireEvent.wheel(codeElement!, { deltaY: 100, shiftKey: true })
    expect(onParentWheel).not.toHaveBeenCalled()

    fireEvent.wheel(codeElement!, { deltaY: 100, shiftKey: false })
    expect(onParentWheel).toHaveBeenCalledTimes(1)
  })
})
