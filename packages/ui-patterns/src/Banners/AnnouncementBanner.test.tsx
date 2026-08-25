import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementBanner } from './AnnouncementBanner'
import {
  SELECT_26_CTA,
  SELECT_26_MESSAGE,
  SELECT_26_TITLE,
  SELECT_26_URL,
  SELECT_26_WWW_DISMISSAL_KEY,
} from './Select26Promotion'

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

  it('shows the complete Select promotion and external CTA', async () => {
    render(<AnnouncementBanner />)

    const message = await screen.findByText((_, element) => {
      return element?.tagName === 'P' && element.textContent === SELECT_26_MESSAGE
    })
    expect(message).toBeVisible()
    expect(screen.getByText(SELECT_26_TITLE)).toBeVisible()
    expect(screen.getByRole('link', { name: new RegExp(SELECT_26_CTA) })).toHaveAttribute(
      'href',
      SELECT_26_URL
    )
    expect(screen.getByRole('link', { name: new RegExp(SELECT_26_CTA) })).toHaveAttribute(
      'target',
      '_blank'
    )
  })

  it('persists dismissal using the Select 2026 campaign key', async () => {
    render(<AnnouncementBanner />)

    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss announcement' }))

    expect(window.localStorage.getItem(SELECT_26_WWW_DISMISSAL_KEY)).toBe('hidden')
    await waitFor(() => expect(screen.queryByText(SELECT_26_TITLE)).not.toBeInTheDocument())
  })

  it('honours a previously persisted dismissal', () => {
    window.localStorage.setItem(SELECT_26_WWW_DISMISSAL_KEY, 'hidden')

    render(<AnnouncementBanner />)

    expect(screen.queryByText(SELECT_26_TITLE)).not.toBeInTheDocument()
  })

  it('remains dismissible on launch-week routes', async () => {
    mockUsePathname.mockReturnValue('/launch-week')
    render(<AnnouncementBanner />)

    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss announcement' }))

    expect(window.localStorage.getItem(SELECT_26_WWW_DISMISSAL_KEY)).toBe('hidden')
    await waitFor(() => expect(screen.queryByText(SELECT_26_TITLE)).not.toBeInTheDocument())
  })
})
