// @vitest-environment jsdom
import { consentState } from 'common/consent-state'
import type { DocsSearchV2State } from 'common/hooks/useDocsSearchV2'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { KbSearch, openKbSearch } from './KbSearch'

const platform = vi.hoisted(() => ({ isPlatform: true }))
const search = vi.hoisted(() => ({ state: { status: 'initial', key: 0 } as DocsSearchV2State }))

vi.hoisted(() => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

vi.mock('common/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common/constants')>()),
  get IS_PLATFORM() {
    return platform.isPlatform
  },
}))

vi.mock('common/hooks/useDocsSearchV2', () => ({
  useDocsSearchV2: () => ({
    searchState: search.state,
    handleDocsSearchDebounced: () => {},
    resetSearch: () => {},
  }),
}))

const result = (path: string) => ({
  path,
  title: path,
  heading: path,
  excerpt: '',
  headingPath: [path],
  score: 1,
})

const resultsState: DocsSearchV2State = {
  status: 'results',
  key: 1,
  results: [result('/kb/guides/a'), result('/kb/guides/b'), result('/kb/guides/c')],
  query: 'storage policies',
}

describe('KbSearch telemetry', () => {
  let root: Root | undefined
  let fetchMock: ReturnType<typeof vi.fn>

  beforeAll(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Element.prototype.scrollIntoView ??= () => {}
  })

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(new Response('{}')))
    vi.stubGlobal('fetch', fetchMock)
    consentState.hasConsented = true
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    consentState.hasConsented = false
    platform.isPlatform = true
    search.state = { status: 'initial', key: 0 }
    vi.unstubAllGlobals()
  })

  function renderWithState(state: DocsSearchV2State) {
    search.state = state
    const container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root!.render(<KbSearch />))
    act(() => openKbSearch())
  }

  const sent = () =>
    fetchMock.mock.calls.map(([, init]) => ({
      ...JSON.parse(init.body),
      keepalive: init.keepalive,
    }))

  const sentActions = () => sent().map(({ action }) => action)

  const sentWith = (action: string) => sent().filter((event) => event.action === action)

  const pressShortcut = () =>
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    })

  const pressEscape = () =>
    act(() => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
    })

  it('sends kb_search_submitted with the query text and counts', () => {
    renderWithState(resultsState)

    expect(sentWith('kb_search_submitted')).toHaveLength(1)
    expect(sentWith('kb_search_submitted')[0].custom_properties).toEqual({
      query: 'storage policies',
      queryLength: 16,
      resultCount: 3,
      hasResults: true,
    })
  })

  it('posts to the telemetry endpoint with cookies and no auth header', () => {
    renderWithState(resultsState)
    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toMatch(/\/platform\/telemetry\/event$/)
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Version: '2' },
    })
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it.each<DocsSearchV2State>([
    { status: 'initial', key: 0 },
    { status: 'loading', key: 1, staleResults: [], staleQuery: '' },
    { status: 'error', key: 1, message: 'failed' },
  ])('sends no search event while the search is $status', (state) => {
    renderWithState(state)

    expect(sentActions()).toEqual(['kb_search_opened'])
  })

  it('reports a search with no results', () => {
    renderWithState({ status: 'noResults', key: 1, query: 'zzz' })

    expect(sentWith('kb_search_submitted')[0].custom_properties).toEqual({
      query: 'zzz',
      queryLength: 3,
      resultCount: 0,
      hasResults: false,
    })
  })

  it('sends kb_search_result_clicked with the 1-based position, with keepalive', () => {
    renderWithState(resultsState)
    const link = document.querySelector<HTMLAnchorElement>('a[href="/kb/guides/b"]')!
    link.addEventListener('click', (event) => event.preventDefault())
    act(() => link.click())

    expect(sentWith('kb_search_result_clicked')[0]).toMatchObject({
      custom_properties: { resultPath: '/kb/guides/b', resultPosition: 2, resultCount: 3 },
      keepalive: true,
    })
  })

  it('sends kb_search_opened with search_input when a search button opens the dialog', () => {
    renderWithState({ status: 'initial', key: 0 })

    expect(sent()).toEqual([
      expect.objectContaining({
        action: 'kb_search_opened',
        custom_properties: { triggerType: 'search_input' },
      }),
    ])
  })

  it('sends one kb_search_opened when a search button is clicked while the dialog is open', () => {
    renderWithState({ status: 'initial', key: 0 })
    act(() => openKbSearch())

    expect(sentActions()).toEqual(['kb_search_opened'])
  })

  it('sends kb_search_opened and kb_search_closed for the keyboard shortcut', () => {
    search.state = { status: 'initial', key: 0 }
    const container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root!.render(<KbSearch />))

    pressShortcut()
    pressShortcut()

    expect(sent()).toEqual([
      expect.objectContaining({
        action: 'kb_search_opened',
        custom_properties: { triggerType: 'keyboard_shortcut' },
      }),
      expect.objectContaining({
        action: 'kb_search_closed',
        custom_properties: { closeReason: 'dismissed' },
      }),
    ])
  })

  it('sends kb_search_closed with dismissed when Escape closes the dialog', () => {
    renderWithState({ status: 'initial', key: 0 })
    pressEscape()

    expect(sentWith('kb_search_closed')).toEqual([
      expect.objectContaining({ custom_properties: { closeReason: 'dismissed' } }),
    ])
  })

  it('sends kb_search_closed with result_navigated and keepalive when a result is clicked', () => {
    renderWithState(resultsState)
    const link = document.querySelector<HTMLAnchorElement>('a[href="/kb/guides/b"]')!
    link.addEventListener('click', (event) => event.preventDefault())
    act(() => link.click())

    expect(sentWith('kb_search_closed')).toEqual([
      expect.objectContaining({
        custom_properties: { closeReason: 'result_navigated' },
        keepalive: true,
      }),
    ])
  })

  it('sends kb_search_closed with result_navigated when Enter opens a result', () => {
    renderWithState(resultsState)
    const input = document.querySelector<HTMLInputElement>('[role="dialog"] input')!
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(sentWith('kb_search_closed')).toEqual([
      expect.objectContaining({
        custom_properties: { closeReason: 'result_navigated' },
        keepalive: true,
      }),
    ])
  })

  it('sends nothing without consent', () => {
    consentState.hasConsented = false
    renderWithState(resultsState)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends nothing off platform', () => {
    platform.isPlatform = false
    renderWithState(resultsState)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
