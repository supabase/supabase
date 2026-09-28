// @vitest-environment jsdom
import './test-utils/dom-stubs'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { TooltipProvider } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FeedbackPin } from './feedback-schema'
import { FeedbackDockProvider, useFeedbackDock } from './FeedbackDockProvider'
import { resetDomStubs, setElementRect, setElementsFromPoint } from './test-utils/dom-stubs'

const mocks = vi.hoisted(() => ({
  sendTelemetryEvent: vi.fn(),
  pathname: '/guides/auth',
  linkClick: vi.fn(),
  buttonPointerDown: vi.fn(),
  dockButtonClick: vi.fn(),
}))

vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => mocks.sendTelemetryEvent }))

vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }))

vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }))

vi.mock('./useSendDocsFeedback', () => ({
  useSendDocsFeedback: () => ({ mutate: vi.fn() }),
}))

const PAGE = { pathname: '/guides/auth' }

const Harness = () => {
  const { state, actions } = useFeedbackDock()
  const handleStartPicking = () => {
    actions.openDock({ vote: 'no', page: PAGE })
    actions.setPicking(true)
  }
  const handleLinkClick = (event: ReactMouseEvent) => {
    // jsdom can't navigate
    event.preventDefault()
    mocks.linkClick()
  }

  return (
    <>
      <header>
        <button type="button" tabIndex={0} id="avatar" aria-label="me@example.com">
          Avatar
        </button>
      </header>
      <main>
        <article>
          <h2 id="install">Install</h2>
          <a id="link" href="/guides/next" onClick={handleLinkClick}>
            Next guide
          </a>
          <button type="button" tabIndex={0} id="tab" onPointerDown={mocks.buttonPointerDown}>
            JavaScript
          </button>
          <div data-feedback-redact>
            <button type="button" tabIndex={0} id="secret">
              acme-prod
            </button>
          </div>
          <div id="embed">
            <iframe id="video" title="Video" />
          </div>
        </article>
        <div data-feedback-ui>
          <button type="button" tabIndex={0} id="start" onClick={handleStartPicking}>
            Start picking
          </button>
          <button type="button" tabIndex={0} id="dock-button" onClick={mocks.dockButtonClick}>
            Dock button
          </button>
        </div>
        <output data-testid="pins">{JSON.stringify(state.draft.pins)}</output>
      </main>
    </>
  )
}

const renderTree = () => (
  <TooltipProvider>
    <FeedbackDockProvider>
      <Harness />
    </FeedbackDockProvider>
  </TooltipProvider>
)

const byId = (id: string): HTMLElement => {
  const element = document.getElementById(id)
  if (!element) throw new Error(`#${id} not rendered`)
  return element
}

const isPicking = () => document.documentElement.hasAttribute('data-feedback-picking')

const getPins = (): FeedbackPin[] => JSON.parse(screen.getByTestId('pins').textContent ?? '[]')

const startPicking = async () => {
  const result = render(renderTree())
  fireEvent.click(byId('start'), { detail: 1 })
  await waitFor(() => expect(isPicking()).toBe(true))
  return result
}

const mouseClick = (element: Element) => {
  setElementsFromPoint(() => [element, document.body, document.documentElement])
  fireEvent.pointerDown(element, { clientX: 10, clientY: 10 })
  fireEvent.mouseDown(element, { clientX: 10, clientY: 10 })
  fireEvent.pointerUp(element, { clientX: 10, clientY: 10 })
  fireEvent.mouseUp(element, { clientX: 10, clientY: 10 })
  return fireEvent.click(element, { clientX: 10, clientY: 10, detail: 1 })
}

const spyOnListenerSignals = () => {
  const spies = [vi.spyOn(window, 'addEventListener'), vi.spyOn(document, 'addEventListener')]
  return (): AbortSignal[] =>
    spies.flatMap((spy) =>
      spy.mock.calls.flatMap(([, , options]) =>
        typeof options === 'object' && options.signal ? [options.signal] : []
      )
    )
}

beforeEach(() => {
  mocks.pathname = '/guides/auth'
})

afterEach(() => {
  cleanup()
  resetDomStubs()
  vi.restoreAllMocks()
  mocks.sendTelemetryEvent.mockReset()
  mocks.linkClick.mockReset()
  mocks.buttonPointerDown.mockReset()
  mocks.dockButtonClick.mockReset()
})

describe('ElementPicker', () => {
  it('blocks page clicks and pointerdown while picking, then restores them after a pin', async () => {
    await startPicking()

    fireEvent.pointerDown(byId('tab'))
    expect(mocks.buttonPointerDown).not.toHaveBeenCalled()

    const isNotPrevented = mouseClick(byId('link'))
    expect(isNotPrevented).toBe(false)
    expect(mocks.linkClick).not.toHaveBeenCalled()

    await waitFor(() => expect(isPicking()).toBe(false))
    expect(getPins()).toEqual([
      expect.objectContaining({ tag: 'a', role: 'link', name: 'Next guide', headingId: 'install' }),
    ])
    expect(mocks.sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_feedback_pin_added',
      properties: { pinCount: 1, elementRole: 'link' },
    })
    expect(document.documentElement.style.cursor).toBe('')

    fireEvent.pointerDown(byId('tab'))
    fireEvent.click(byId('link'), { detail: 1 })
    expect(mocks.buttonPointerDown).toHaveBeenCalledOnce()
    expect(mocks.linkClick).toHaveBeenCalledOnce()
  })

  it('neither blocks nor pins clicks inside feedback UI', async () => {
    await startPicking()

    mouseClick(byId('dock-button'))

    expect(mocks.dockButtonClick).toHaveBeenCalledOnce()
    expect(isPicking()).toBe(true)
    expect(getPins()).toEqual([])
  })

  it('lets keyboard-activated clicks through without pinning', async () => {
    await startPicking()

    fireEvent.click(byId('link'), { detail: 0 })

    expect(mocks.linkClick).toHaveBeenCalledOnce()
    expect(isPicking()).toBe(true)
    expect(getPins()).toEqual([])
  })

  it.each([
    ['Escape', () => fireEvent.keyDown(document.body, { key: 'Escape' })],
    ['window blur', () => window.dispatchEvent(new Event('blur'))],
    ['pagehide', () => window.dispatchEvent(new Event('pagehide'))],
  ])('on %s, removes every listener and resets the page', async (_, exit) => {
    const getSignals = spyOnListenerSignals()
    await startPicking()
    expect(getSignals().length).toBeGreaterThanOrEqual(10)

    act(exit)

    await waitFor(() => expect(isPicking()).toBe(false))
    expect(getSignals().every((signal) => signal.aborted)).toBe(true)
    expect(document.documentElement.style.cursor).toBe('')
    expect(document.querySelector('style')?.textContent ?? '').not.toContain(
      'data-feedback-picking'
    )
    fireEvent.pointerDown(byId('tab'))
    expect(mocks.buttonPointerDown).toHaveBeenCalledOnce()
  })

  it('removes every listener on unmount', async () => {
    const getSignals = spyOnListenerSignals()
    const { unmount } = await startPicking()

    unmount()

    expect(getSignals().length).toBeGreaterThanOrEqual(10)
    expect(getSignals().every((signal) => signal.aborted)).toBe(true)
    expect(isPicking()).toBe(false)
    expect(document.documentElement.style.cursor).toBe('')
  })

  it('exits when the pathname changes', async () => {
    const { rerender } = await startPicking()

    mocks.pathname = '/guides/database'
    rerender(renderTree())

    await waitFor(() => expect(isPicking()).toBe(false))
  })

  it('pins an iframe under the pointer when the hit is its container', async () => {
    await startPicking()
    setElementRect(byId('video'), { left: 0, top: 0, width: 200, height: 100 })

    mouseClick(byId('embed'))

    await waitFor(() => expect(getPins()).toHaveLength(1))
    expect(getPins()[0]).toMatchObject({ tag: 'iframe', role: 'iframe', name: 'Video' })
  })

  it('nulls text and name for a redacted element', async () => {
    await startPicking()

    mouseClick(byId('secret'))

    await waitFor(() => expect(getPins()).toHaveLength(1))
    expect(getPins()[0]).toMatchObject({ tag: 'button', text: null, name: null })
    expect(screen.getByTestId('pins').textContent).not.toContain('acme-prod')
  })

  it('keeps only tag and role outside the allowed regions', async () => {
    await startPicking()

    mouseClick(byId('avatar'))

    await waitFor(() => expect(getPins()).toHaveLength(1))
    expect(getPins()[0]).toEqual({
      tag: 'button',
      role: 'button',
      pathname: '/guides/auth',
      name: null,
      text: null,
      headingId: null,
      headingText: null,
    })
  })
})
