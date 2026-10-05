import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementBanner } from './AnnouncementBanner'
import { TOS_UPDATE_WWW_DISMISSAL_KEY } from './TosUpdateBanner'

const DEFAULT_ANNOUNCEMENT_DISMISSAL_KEY = 'announcement_lw15_d2'

const mockUsePathname = vi.fn(() => '/database')

vi.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }))

describe('AnnouncementBanner', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    mockUsePathname.mockReturnValue('/database')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-08-25T00:00:00-07:00'))
  })

  afterEach(() => vi.useRealTimers())

  it('falls back to the default announcement before the ToS update date', () => {
    render(<AnnouncementBanner />)

    expect(screen.queryByRole('link', { name: 'Terms of Service' })).not.toBeInTheDocument()
  })

  it('shows the ToS update notice once it is live', async () => {
    vi.setSystemTime(new Date('2026-10-05T00:00:00-07:00'))
    render(<AnnouncementBanner />)

    expect(await screen.findByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/terms'
    )
  })

  it('switches from the default announcement to the ToS update notice on a timer, without a refresh', async () => {
    vi.setSystemTime(new Date('2026-10-04T23:59:00-07:00'))
    render(<AnnouncementBanner />)

    expect(screen.queryByRole('link', { name: 'Terms of Service' })).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(60 * 1000))

    expect(await screen.findByRole('link', { name: 'Terms of Service' })).toBeVisible()
  })

  it('persists ToS update dismissal under its own key, independent of the default announcement key', async () => {
    vi.setSystemTime(new Date('2026-10-05T00:00:00-07:00'))
    render(<AnnouncementBanner />)

    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss announcement' }))

    expect(window.localStorage.getItem(TOS_UPDATE_WWW_DISMISSAL_KEY)).toBe('hidden')
    expect(window.localStorage.getItem(DEFAULT_ANNOUNCEMENT_DISMISSAL_KEY)).toBeNull()

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Terms of Service' })).not.toBeInTheDocument()
    )
  })
})
