// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { DocsSearchV2State } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SearchV2Trigger } from './SearchV2Trigger'

const sendTelemetryEvent = vi.fn()
const push = vi.fn()
const handleDocsSearchDebounced = vi.fn()
const resetSearch = vi.fn()
let searchState: DocsSearchV2State

vi.mock('@/lib/telemetry', () => ({ useSendTelemetryEvent: () => sendTelemetryEvent }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/link', () => ({
  default: ({
    prefetch: _prefetch,
    ...props
  }: React.ComponentProps<'a'> & { prefetch?: boolean }) => <a {...props} />,
}))
const useDocsSearchV2 = vi.fn((_options: { endpoint: string }) => ({
  searchState,
  handleDocsSearchDebounced,
  resetSearch,
}))
vi.mock('common', () => ({
  useDocsSearchV2: (options: { endpoint: string }) => useDocsSearchV2(options),
}))

const result = {
  path: '/guides/auth',
  title: 'Auth',
  heading: 'Auth',
  excerpt: 'Learn about auth',
  headingPath: ['Auth'],
  score: 1,
}
const resultsState: DocsSearchV2State = {
  status: 'results',
  key: 1,
  results: [result],
  query: 'auth',
}

// cmdk and Radix lean on browser APIs jsdom doesn't ship
beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollIntoView ??= () => {}
  searchState = { status: 'initial', key: 0 }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const eventActions = () => sendTelemetryEvent.mock.calls.map(([event]) => event.action)

function openDialog() {
  const view = render(<SearchV2Trigger />)
  fireEvent.click(screen.getByRole('button', { name: /search/i }))
  return view
}

function setSearchState(view: ReturnType<typeof render>, next: DocsSearchV2State) {
  searchState = next
  act(() => view.rerender(<SearchV2Trigger />))
}

describe('SearchV2 telemetry', () => {
  it("searches through the docs app's own route, under its base path", () => {
    openDialog()

    expect(useDocsSearchV2).toHaveBeenCalledWith({ endpoint: '/docs/api/search_v2' })
  })

  it('sends docs_search_v2_opened with search_input when the trigger is clicked', () => {
    openDialog()

    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_opened',
      properties: { triggerType: 'search_input' },
    })
  })

  it('sends docs_search_v2_opened with keyboard_shortcut on Cmd+K', () => {
    render(<SearchV2Trigger />)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_opened',
      properties: { triggerType: 'keyboard_shortcut' },
    })
  })

  it('ignores k without Cmd', () => {
    render(<SearchV2Trigger />)

    fireEvent.keyDown(window, { key: 'k' })

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })

  it('sends docs_search_v2_closed when the dialog closes', () => {
    openDialog()
    sendTelemetryEvent.mockClear()

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({ action: 'docs_search_v2_closed' })
  })

  it('runs the debounced search while typing and resets when the input is cleared', () => {
    openDialog()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'auth' } })
    expect(handleDocsSearchDebounced).toHaveBeenCalledWith('auth')
    expect(resetSearch).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '' } })
    expect(resetSearch).toHaveBeenCalledTimes(1)
  })

  it('resets the search from the Clear button', () => {
    openDialog()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'auth' } })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(resetSearch).toHaveBeenCalledTimes(1)
  })

  describe('docs_search_v2_search_submitted', () => {
    it('is sent with hasResults true once results settle', () => {
      const view = openDialog()
      sendTelemetryEvent.mockClear()

      setSearchState(view, resultsState)

      expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_search_submitted',
        properties: { query: 'auth', hasResults: true },
      })
    })

    it('is sent with hasResults false when nothing matches', () => {
      const view = openDialog()
      sendTelemetryEvent.mockClear()

      setSearchState(view, { status: 'noResults', key: 1, query: 'zzz' })

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_search_submitted',
        properties: { query: 'zzz', hasResults: false },
      })
    })

    it('is not sent while loading or on error', () => {
      const view = openDialog()
      sendTelemetryEvent.mockClear()

      setSearchState(view, { status: 'loading', key: 1, staleResults: [], staleQuery: '' })
      setSearchState(view, { status: 'error', key: 2, message: 'nope' })

      expect(eventActions()).not.toContain('docs_search_v2_search_submitted')
    })
  })

  describe('docs_search_v2_result_clicked', () => {
    it('is sent when a result link is clicked, which closes the dialog without a router push', () => {
      const view = openDialog()
      setSearchState(view, resultsState)
      sendTelemetryEvent.mockClear()

      fireEvent.click(screen.getByRole('option', { name: /Learn about auth/ }))

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_result_clicked',
        properties: { resultPath: '/guides/auth', query: 'auth' },
      })
      // the link's own click handler closes the dialog before cmdk's onSelect reports the click
      expect(eventActions()).toEqual(['docs_search_v2_closed', 'docs_search_v2_result_clicked'])
      expect(push).not.toHaveBeenCalled()
    })

    it('is sent once and does not close the dialog for a new-tab click', () => {
      const view = openDialog()
      setSearchState(view, resultsState)
      sendTelemetryEvent.mockClear()

      fireEvent.click(screen.getByRole('option', { name: /Learn about auth/ }), { metaKey: true })

      expect(eventActions()).toEqual(['docs_search_v2_result_clicked'])
      expect(screen.getByRole('combobox')).toBeTruthy()
    })

    it('is sent on Enter, which navigates with the router and closes the dialog', () => {
      const view = openDialog()
      setSearchState(view, resultsState)
      sendTelemetryEvent.mockClear()

      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_result_clicked',
        properties: { resultPath: '/guides/auth', query: 'auth' },
      })
      expect(push).toHaveBeenCalledWith('/guides/auth')
      expect(eventActions()).toEqual(['docs_search_v2_result_clicked', 'docs_search_v2_closed'])
    })

    it('reports the query the visible results belong to while a new search is loading', () => {
      const view = openDialog()
      setSearchState(view, {
        status: 'loading',
        key: 2,
        staleResults: [result],
        staleQuery: 'auth',
      })
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'authent' } })
      sendTelemetryEvent.mockClear()

      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })

      expect(sendTelemetryEvent).toHaveBeenCalledWith({
        action: 'docs_search_v2_result_clicked',
        properties: { resultPath: '/guides/auth', query: 'auth' },
      })
    })
  })
})
