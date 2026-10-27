// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SearchButton } from './NotFound.client'
import type { SearchV2Variant } from '@/features/SearchV2/constants'

const sendTelemetryEvent = vi.fn()
const setCommandMenuOpen = vi.fn()
let variant: SearchV2Variant

vi.mock('@/lib/telemetry', () => ({ useSendTelemetryEvent: () => sendTelemetryEvent }))
vi.mock('@/features/SearchV2/useSearchV2Variant', () => ({ useSearchV2Variant: () => variant }))
vi.mock('@/components/ButtonCard', () => ({ default: () => null }))
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
  useDocsSearch: vi.fn(),
  useDocsSearchV2: () => ({
    searchState: { status: 'initial', key: 0 },
    handleDocsSearchDebounced: vi.fn(),
    resetSearch: vi.fn(),
  }),
}))
vi.mock('ui-patterns/CommandMenu', () => ({ useSetCommandMenuOpen: () => setCommandMenuOpen }))
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
  cleanup()
  vi.clearAllMocks()
})

describe('404 SearchButton', () => {
  describe('in the control variant', () => {
    beforeEach(() => {
      variant = 'control'
    })

    it('opens the legacy command menu', () => {
      render(<SearchButton />)

      fireEvent.click(screen.getByRole('button', { name: 'Search for page' }))

      expect(setCommandMenuOpen).toHaveBeenCalledWith(true)
      expect(screen.queryByRole('combobox')).toBeNull()
      expect(sendTelemetryEvent).not.toHaveBeenCalled()
    })
  })

  describe('in the search-v2-active variant', () => {
    beforeEach(() => {
      variant = 'search-v2-active'
    })

    it('opens the Search V2 dialog instead of the legacy command menu', () => {
      render(<SearchButton />)

      fireEvent.click(screen.getByRole('button', { name: 'Search for page' }))

      expect(screen.getByRole('combobox')).toBeTruthy()
      expect(setCommandMenuOpen).not.toHaveBeenCalled()
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
      expect(sendTelemetryEvent).toHaveBeenCalledWith({ action: 'docs_search_v2_closed' })
    })
  })
})
