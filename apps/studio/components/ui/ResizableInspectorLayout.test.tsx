import { act, fireEvent, render, screen } from '@testing-library/react'
import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResizableInspectorLayout } from './ResizableInspectorLayout'

const { mockInspectorPanel, mockResize } = vi.hoisted(() => {
  const resize = vi.fn()

  return {
    mockInspectorPanel: {
      collapse: vi.fn(),
      expand: vi.fn(),
      isCollapsed: vi.fn(() => false),
      resize,
    },
    mockResize: resize,
  }
})

interface MockPanelGroupProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  elementRef?: Ref<HTMLDivElement>
  orientation?: 'horizontal' | 'vertical'
}

interface MockPanelProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
  id?: string
  panelRef?: unknown
  onResize?: unknown
  defaultSize?: number | string
  minSize?: number | string
  maxSize?: number | string
}

interface MockHandleProps extends HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
  disabled?: boolean
}

vi.mock('ui', async () => {
  const React = await import('react')

  return {
    cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
    usePanelRef: () => React.useRef(mockInspectorPanel),
    ResizablePanelGroup: ({ children, elementRef, orientation, ...props }: MockPanelGroupProps) => (
      <div ref={elementRef} data-testid="inspector-group" data-orientation={orientation} {...props}>
        {children}
      </div>
    ),
    ResizablePanel: ({
      children,
      id,
      panelRef: _panelRef,
      onResize: _onResize,
      defaultSize: _defaultSize,
      minSize: _minSize,
      maxSize: _maxSize,
      ...props
    }: MockPanelProps) => (
      <section data-testid={id} {...props}>
        {children}
      </section>
    ),
    ResizableHandle: ({ withHandle: _withHandle, disabled, ...props }: MockHandleProps) => (
      <div role="separator" aria-disabled={disabled} {...props} />
    ),
  }
})

let resizeObserverCallback: ResizeObserverCallback

class MockResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallback = callback
  }

  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

const StatefulInspector = () => {
  const [count, setCount] = useState(0)

  return (
    <button tabIndex={0} onClick={() => setCount((value) => value + 1)}>
      Inspector count: {count}
    </button>
  )
}

const resizeContainer = (width: number) => {
  act(() => {
    resizeObserverCallback(
      [{ contentRect: { width } } as ResizeObserverEntry],
      {} as ResizeObserver
    )
  })
}

describe('ResizableInspectorLayout', () => {
  beforeEach(() => {
    mockResize.mockClear()
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 612,
      height: 600,
      top: 0,
      right: 612,
      bottom: 600,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('snaps the same inspector to the full container and restores its previous size', () => {
    render(
      <ResizableInspectorLayout
        orientation="vertical"
        mainPanelId="main-panel"
        inspectorPanelId="inspector-panel"
        inspectorLabel="Details"
        mainMinSize={280}
        inspectorDefaultSize={360}
        inspectorMinSize={320}
        inspector={<StatefulInspector />}
      >
        <div>Main content</div>
      </ResizableInspectorLayout>
    )

    const group = screen.getByTestId('inspector-group')
    const inspector = screen.getByRole('region', { name: 'Details' })

    expect(group).not.toHaveAttribute('data-inspector-snapped')
    expect(group).toHaveAttribute('data-orientation', 'vertical')

    fireEvent.click(screen.getByRole('button', { name: 'Inspector count: 0' }))
    expect(screen.getByRole('button', { name: 'Inspector count: 1' })).toBeInTheDocument()

    resizeContainer(393)

    expect(group).toHaveAttribute('data-inspector-snapped')
    expect(group).toHaveAttribute('data-orientation', 'horizontal')
    expect(screen.getByRole('separator')).toHaveClass('hidden')
    expect(mockResize).toHaveBeenLastCalledWith('100%')
    expect(screen.getByRole('region', { name: 'Details' })).toBe(inspector)
    expect(screen.getByRole('button', { name: 'Inspector count: 1' })).toBeInTheDocument()

    resizeContainer(612)

    expect(group).not.toHaveAttribute('data-inspector-snapped')
    expect(group).toHaveAttribute('data-orientation', 'vertical')
    expect(mockResize).toHaveBeenLastCalledWith(360)
    expect(screen.getByRole('region', { name: 'Details' })).toBe(inspector)
    expect(screen.getByRole('button', { name: 'Inspector count: 1' })).toBeInTheDocument()
  })
})
