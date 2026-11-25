import { act, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('radix-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('radix-ui')>()
  const Root = ({ type }: ComponentProps<typeof actual.ScrollArea.Root>) => (
    <div data-testid="scroll-root" data-type={type} />
  )
  return { ...actual, ScrollArea: { ...actual.ScrollArea, Root } }
})

const resizeCallbacks: Array<() => void> = []

// a detached element has no layout, so the browser reports zero for both widths
const mockScrollBarWidth = (width: number) => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
    this: HTMLElement
  ) {
    return this.isConnected ? 50 : 0
  })
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement
  ) {
    return this.isConnected ? 50 - width : 0
  })
}

const renderScrollType = async () => {
  // the scroll type lives in module state, so each test needs a fresh module
  const { ScrollRoot } = await import('./scroll-area')
  render(<ScrollRoot />)
  return screen.getByTestId('scroll-root')
}

describe('ScrollRoot', () => {
  beforeEach(() => {
    vi.resetModules()
    resizeCallbacks.length = 0
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallbacks.push(callback)
        }
        observe() {}
        disconnect() {}
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('always shows the bar when the os uses classic scroll bars', async () => {
    mockScrollBarWidth(15)

    expect(await renderScrollType()).toHaveAttribute('data-type', 'auto')
  })

  it('shows the bar while scrolling when the os uses overlay scroll bars', async () => {
    mockScrollBarWidth(0)

    expect(await renderScrollType()).toHaveAttribute('data-type', 'scroll')
  })

  it('measures again when the os scroll bar setting changes', async () => {
    mockScrollBarWidth(0)
    const root = await renderScrollType()

    mockScrollBarWidth(15)
    act(() => resizeCallbacks.forEach((callback) => callback()))

    expect(root).toHaveAttribute('data-type', 'auto')
  })

  it('falls back to scroll without resizeobserver', async () => {
    vi.stubGlobal('ResizeObserver', undefined)
    mockScrollBarWidth(15)

    expect(await renderScrollType()).toHaveAttribute('data-type', 'scroll')
  })
})
