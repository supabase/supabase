// @vitest-environment jsdom
import { consentState } from 'common/consent-state'
import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_NAME,
  MW_DIAG_COOKIE_NAME,
  serializeFirstReferrerCookie,
} from 'common/first-referrer-cookie'
import { posthogClient } from 'common/posthog-client'
import { getFirstTouchData } from 'common/telemetry-first-touch-store'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { PageTelemetryIsland } from './PageTelemetryIsland'

const platform = vi.hoisted(() => ({ isPlatform: true }))

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

describe('PageTelemetryIsland', () => {
  let root: Root | undefined

  beforeAll(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  })

  beforeEach(() => {
    vi.spyOn(posthogClient, 'init').mockImplementation(() => {})
    vi.spyOn(posthogClient, 'capturePageView').mockImplementation(() => {})
    vi.spyOn(posthogClient, 'capturePageLeave').mockImplementation(() => {})
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    consentState.hasConsented = false
    document.cookie = `${FIRST_REFERRER_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    document.cookie = `${MW_DIAG_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    platform.isPlatform = true
    sessionStorage.clear()
    setReferrer('')
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
  })

  function setReferrer(referrer: string) {
    Object.defineProperty(document, 'referrer', { value: referrer, configurable: true })
  }

  function setFirstReferrerCookie() {
    const data = buildFirstReferrerData({
      referrer: 'https://www.google.com/',
      landingUrl: 'https://supabase.com/kb?utm_source=google&gclid=abc',
    })
    document.cookie = `${FIRST_REFERRER_COOKIE_NAME}=${encodeURIComponent(serializeFirstReferrerCookie(data))}; path=/`
  }

  function render() {
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<PageTelemetryIsland />))
  }

  it('sends nothing before consent', () => {
    consentState.hasConsented = false
    render()

    expect(posthogClient.init).not.toHaveBeenCalled()
    expect(posthogClient.capturePageView).not.toHaveBeenCalled()
  })

  it('sends nothing off platform, even after consent', () => {
    platform.isPlatform = false
    consentState.hasConsented = true
    render()

    expect(posthogClient.init).not.toHaveBeenCalled()
    expect(posthogClient.capturePageView).not.toHaveBeenCalled()
  })

  it('sends one pageview once consent is given', async () => {
    render()

    await act(async () => {
      consentState.hasConsented = true
    })

    expect(posthogClient.init).toHaveBeenCalledOnce()
    expect(posthogClient.capturePageView).toHaveBeenCalledOnce()
    expect(posthogClient.capturePageView).toHaveBeenCalledWith(
      expect.objectContaining({
        $current_url: window.location.href,
        $pathname: window.location.pathname,
        $host: window.location.hostname,
        page_title: document.title,
      })
    )
  })

  it('does not send a second pageview when consent changes again', async () => {
    consentState.hasConsented = true
    render()

    await act(async () => {
      consentState.hasConsented = false
    })
    await act(async () => {
      consentState.hasConsented = true
    })

    expect(posthogClient.capturePageView).toHaveBeenCalledOnce()
  })

  it('attributes the first pageview to the first-referrer cookie', () => {
    setFirstReferrerCookie()
    consentState.hasConsented = true
    render()

    expect(posthogClient.capturePageView).toHaveBeenCalledWith(
      expect.objectContaining({
        $referrer: 'https://www.google.com/',
        $utm_source: 'google',
        gclid: 'abc',
        first_referrer_cookie_present: true,
        first_referrer_cookie_consumed: true,
      })
    )
  })

  it('does not reattribute later KB pages to the first referrer', () => {
    setFirstReferrerCookie()
    setReferrer('https://supabase.com/kb/guides/a')
    consentState.hasConsented = true
    render()
    act(() => root?.unmount())
    vi.mocked(posthogClient.capturePageView).mockClear()

    render()

    const props = vi.mocked(posthogClient.capturePageView).mock.calls[0][0]
    expect(props.$referrer).toBe('https://supabase.com/kb/guides/a')
    expect(props).not.toHaveProperty('$utm_source')
    expect(props).not.toHaveProperty('first_referrer_cookie_present')
  })

  it('attributes the first pageview after consent even on a later KB page', async () => {
    setFirstReferrerCookie()
    setReferrer('https://supabase.com/kb/guides/a')
    render()

    await act(async () => {
      consentState.hasConsented = true
    })

    expect(posthogClient.capturePageView).toHaveBeenCalledWith(
      expect.objectContaining({
        $referrer: 'https://www.google.com/',
        $utm_source: 'google',
        first_referrer_cookie_consumed: true,
      })
    )
  })

  it('attributes a same-tab return from an external source', () => {
    sessionStorage.setItem('kb_first_pageview_sent', '1')
    window.history.replaceState(null, '', '/kb?utm_source=google&gclid=abc')
    setReferrer('https://www.google.com/')
    consentState.hasConsented = true
    render()

    expect(posthogClient.capturePageView).toHaveBeenCalledWith(
      expect.objectContaining({ $utm_source: 'google', gclid: 'abc' })
    )
  })

  it('attributes a same-tab return with no referrer', () => {
    sessionStorage.setItem('kb_first_pageview_sent', '1')
    setFirstReferrerCookie()
    setReferrer('')
    consentState.hasConsented = true
    render()

    expect(posthogClient.capturePageView).toHaveBeenCalledWith(
      expect.objectContaining({
        $referrer: 'https://www.google.com/',
        first_referrer_cookie_present: true,
      })
    )
  })

  it('sends no pageview when the page is restored from the back-forward cache', () => {
    consentState.hasConsented = true
    render()

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))

    expect(posthogClient.capturePageView).toHaveBeenCalledOnce()
  })

  it('still sends a pageview when sessionStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    consentState.hasConsented = true
    render()

    expect(posthogClient.capturePageView).toHaveBeenCalledOnce()
  })

  it('sends landing-page UTMs captured before consent', async () => {
    window.history.replaceState(null, '', '/kb?utm_source=google&gclid=abc')
    setReferrer('https://www.google.com/')
    render()

    await act(async () => {
      consentState.hasConsented = true
    })

    expect(posthogClient.capturePageView).toHaveBeenCalledWith(
      expect.objectContaining({
        $utm_source: 'google',
        gclid: 'abc',
        first_touch_pathname: '/kb',
      })
    )
    expect(getFirstTouchData()).toBeNull()
  })

  it('sends the middleware diagnostic cookie', () => {
    document.cookie = `${MW_DIAG_COOKIE_NAME}=${encodeURIComponent('hit=1&would_stamp=1')}; path=/`
    consentState.hasConsented = true
    render()

    expect(posthogClient.capturePageView).toHaveBeenCalledWith(
      expect.objectContaining({ mw_diag_hit: true, mw_diag_would_stamp: true })
    )
  })

  it('sends a pageleave on unload after consent', () => {
    consentState.hasConsented = true
    render()

    window.dispatchEvent(new Event('beforeunload'))

    expect(posthogClient.capturePageLeave).toHaveBeenCalledWith(
      expect.objectContaining({ $pathname: window.location.pathname })
    )
  })

  it('does not send a pageleave without consent', () => {
    render()

    window.dispatchEvent(new Event('beforeunload'))

    expect(posthogClient.capturePageLeave).not.toHaveBeenCalled()
  })
})
