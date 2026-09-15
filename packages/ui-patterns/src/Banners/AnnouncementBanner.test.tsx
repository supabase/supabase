import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementBanner } from './AnnouncementBanner'
import {
  PRIVACY_POLICY_BANNER_DISMISSAL_KEY,
  PRIVACY_POLICY_CONTACT_EMAIL,
} from './PrivacyPolicyPromotion'
import {
  SELECT_26_CTA,
  SELECT_26_MESSAGE,
  SELECT_26_TITLE,
  SELECT_26_URL,
  SELECT_26_WWW_DISMISSAL_KEY,
} from './Select26Promotion'

const mockUsePathname = vi.fn(() => '/database')
const mockUsePrivacyPolicyBannerActive = vi.fn(() => false)

vi.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }))
vi.mock('./PrivacyPolicyPromotion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./PrivacyPolicyPromotion')>()
  return { ...actual, usePrivacyPolicyBannerActive: () => mockUsePrivacyPolicyBannerActive() }
})

describe('AnnouncementBanner', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    mockUsePathname.mockReturnValue('/database')
    mockUsePrivacyPolicyBannerActive.mockReturnValue(false)
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

  describe('when the Privacy Policy banner is live', () => {
    beforeEach(() => mockUsePrivacyPolicyBannerActive.mockReturnValue(true))

    it('shows the notice with links to the policy and to contact', async () => {
      render(<AnnouncementBanner />)

      expect(await screen.findByText(/Privacy Policy Update/)).toBeVisible()
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
        'href',
        '/privacy'
      )
      expect(screen.getByRole('link', { name: 'contact us' })).toHaveAttribute(
        'href',
        `mailto:${PRIVACY_POLICY_CONTACT_EMAIL}`
      )
    })

    it('takes priority over the Select 2026 promotion', () => {
      render(<AnnouncementBanner />)

      expect(screen.queryByText(SELECT_26_TITLE)).not.toBeInTheDocument()
    })

    it('persists dismissal under its own key, independent of the Select 2026 key', async () => {
      render(<AnnouncementBanner />)

      fireEvent.click(await screen.findByRole('button', { name: 'Dismiss announcement' }))

      expect(window.localStorage.getItem(PRIVACY_POLICY_BANNER_DISMISSAL_KEY)).toBe('hidden')
      expect(window.localStorage.getItem(SELECT_26_WWW_DISMISSAL_KEY)).toBeNull()
      await waitFor(() =>
        expect(screen.queryByText(/Privacy Policy Update/)).not.toBeInTheDocument()
      )
    })

    it('honours a previously persisted dismissal', () => {
      window.localStorage.setItem(PRIVACY_POLICY_BANNER_DISMISSAL_KEY, 'hidden')

      render(<AnnouncementBanner />)

      expect(screen.queryByText(/Privacy Policy Update/)).not.toBeInTheDocument()
    })
  })
})
