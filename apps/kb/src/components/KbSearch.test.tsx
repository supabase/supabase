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
  query: 'secret query',
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

  it('sends kb_search_submitted with counts and no query text', () => {
    renderWithState(resultsState)

    expect(sent()).toHaveLength(1)
    expect(sent()[0]).toMatchObject({
      action: 'kb_search_submitted',
      custom_properties: { queryLength: 12, resultCount: 3, hasResults: true },
    })
    expect(JSON.stringify(sent()[0].custom_properties)).not.toContain('secret')
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
  ])('sends nothing while the search is $status', (state) => {
    renderWithState(state)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports a search with no results', () => {
    renderWithState({ status: 'noResults', key: 1, query: 'zzz' })

    expect(sent()[0].custom_properties).toEqual({
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

    expect(sent()[1]).toMatchObject({
      action: 'kb_search_result_clicked',
      custom_properties: { resultPath: '/kb/guides/b', resultPosition: 2, resultCount: 3 },
      keepalive: true,
    })
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
