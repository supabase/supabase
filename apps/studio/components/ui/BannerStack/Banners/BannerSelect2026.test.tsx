import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BannerSelect2026 } from './BannerSelect2026'

const { dismissBanner, setWaitlistDismissed, setLivestreamDismissed } = vi.hoisted(() => ({
  dismissBanner: vi.fn(),
  setWaitlistDismissed: vi.fn(),
  setLivestreamDismissed: vi.fn(),
}))

vi.mock('../BannerStackProvider', () => ({
  BANNER_ID: { SELECT_26: 'select-2026-banner' },
  useBannerStack: () => ({ dismissBanner }),
}))

vi.mock('@/hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: (key: string) => [
    false,
    key === 'select-2026-livestream-dismissed' ? setLivestreamDismissed : setWaitlistDismissed,
  ],
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-02T07:59:59.999-07:00'))
  vi.clearAllMocks()
})

afterEach(() => vi.useRealTimers())

describe('BannerSelect2026', () => {
  it('switches copy and dismissal key at 8am, then disappears at 5:30pm', () => {
    render(<BannerSelect2026 />)

    expect(screen.getByRole('link', { name: 'Apply to attend' })).toHaveAttribute(
      'href',
      'https://select.supabase.com/'
    )

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('link', { name: 'Watch livestream' })).toHaveAttribute(
      'href',
      'https://select.supabase.com/'
    )
    expect(screen.getByText('Supabase Select 2026')).toBeVisible()
    expect(
      screen.getByText('Keynote, main stage, and build stage, streamed all day.')
    ).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Close banner' }))
    expect(setLivestreamDismissed).toHaveBeenCalledWith(true)
    expect(setWaitlistDismissed).not.toHaveBeenCalled()
    expect(dismissBanner).toHaveBeenCalledWith('select-2026-banner')

    vi.setSystemTime(new Date('2026-10-02T17:30:00-07:00'))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.queryByRole('link', { name: 'Watch livestream' })).toBeNull()
  })
})
