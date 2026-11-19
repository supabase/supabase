// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Recommendations, SearchButton } from './NotFound.client'

const sendTelemetryEvent = vi.fn()
const handleDocsSearch = vi.fn()
const buttonCard = vi.fn((_props: { to: string; title: string; description?: string }) => null)
let searchState: Record<string, unknown> = { status: 'initial', key: 0 }

vi.mock('@/lib/telemetry', () => ({ useSendTelemetryEvent: () => sendTelemetryEvent }))
vi.mock('@/components/ButtonCard', () => ({
  default: (props: { to: string; title: string; description?: string }) => buttonCard(props),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/guides/missing',
}))
vi.mock('next/link', () => ({
  default: ({
    prefetch: _prefetch,
    ...props
  }: React.ComponentProps<'a'> & { prefetch?: boolean }) => <a {...props} />,
}))
vi.mock('common', () => ({
  useDocsSearchV2: () => ({
    searchState,
    handleDocsSearch,
    handleDocsSearchDebounced: vi.fn(),
    resetSearch: vi.fn(),
  }),
}))
vi.mock('ui-patterns/ShimmeringLoader', () => ({ GenericSkeletonLoader: () => null }))

// cmdk and Radix lean on browser APIs jsdom doesn't ship
beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollIntoView ??= () => {}
})

afterEach(() => {
  searchState = { status: 'initial', key: 0 }
  cleanup()
  vi.clearAllMocks()
})

describe('404 SearchButton', () => {
  it('opens the Search V2 dialog', () => {
    render(<SearchButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Search for page' }))

    expect(screen.getByRole('combobox')).toBeTruthy()
  })

  it('sends docs_search_v2_opened with not_found_button', () => {
    render(<SearchButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Search for page' }))

    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_opened',
      properties: { triggerType: 'not_found_button' },
    })
  })

  it('sends docs_search_v2_closed when the dialog closes', () => {
    render(<SearchButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Search for page' }))
    sendTelemetryEvent.mockClear()

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith({
      action: 'docs_search_v2_closed',
      properties: { closeReason: 'dismissed' },
    })
  })
})

describe('404 Recommendations', () => {
  it('searches with the words of the missing path', () => {
    render(<Recommendations />)

    expect(handleDocsSearch).toHaveBeenCalledWith('missing')
  })

  it('lists each matching page once', () => {
    const result = { title: 'Auth', heading: 'Intro', excerpt: 'About auth', headingPath: [] }
    searchState = {
      status: 'results',
      key: 1,
      query: 'missing',
      results: [
        { ...result, path: '/guides/auth', score: 2 },
        { ...result, path: '/guides/auth', heading: 'Other', score: 1 },
        { ...result, path: '/guides/auth/jwts', score: 1 },
      ],
    }

    render(<Recommendations />)

    expect(buttonCard.mock.calls.map(([props]) => props.to)).toEqual([
      '/guides/auth',
      '/guides/auth/jwts',
    ])
  })

  it('shows a fallback when nothing matches', () => {
    searchState = { status: 'noResults', key: 1, query: 'missing' }

    render(<Recommendations />)

    expect(screen.getByText('No recommendations found.')).toBeTruthy()
  })
})
