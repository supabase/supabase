// @vitest-environment jsdom
import { consentState } from 'common/consent-state'
import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_NAME,
  serializeFirstReferrerCookie,
} from 'common/first-referrer-cookie'
import { posthogClient } from 'common/posthog-client'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { PageTelemetryIsland } from './PageTelemetryIsland'

vi.hoisted(() => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

vi.mock('common/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common/constants')>()),
  IS_PLATFORM: true,
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
    vi.restoreAllMocks()
  })

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
    const data = buildFirstReferrerData({
      referrer: 'https://www.google.com/',
      landingUrl: 'https://supabase.com/kb?utm_source=google&gclid=abc',
    })
    document.cookie = `${FIRST_REFERRER_COOKIE_NAME}=${encodeURIComponent(serializeFirstReferrerCookie(data))}; path=/`
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
