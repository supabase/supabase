import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResizableInspectorLayout } from './ResizableInspectorLayout'

class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}

  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

const InspectorLayout = ({ open }: { open: boolean }) => (
  <ResizableInspectorLayout
    mainPanelId="main-panel"
    inspectorPanelId="inspector-panel"
    inspectorLabel="Details"
    mainMinSize={280}
    inspectorMinSize={320}
    inspector={open ? <div>Inspector content</div> : undefined}
  >
    <div>Main content</div>
  </ResizableInspectorLayout>
)

describe('ResizableInspectorLayout integration', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 393,
      height: 600,
      top: 0,
      right: 393,
      bottom: 600,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('can open, close, and reopen the inspector', () => {
    const { rerender } = render(<InspectorLayout open />)

    rerender(<InspectorLayout open={false} />)

    expect(() => rerender(<InspectorLayout open />)).not.toThrow()
  })
})
