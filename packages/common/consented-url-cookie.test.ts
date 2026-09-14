// @vitest-environment jsdom
/// <reference types="vitest/jsdom" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { consentState } from './consent-state'
import {
  clearConsentedUrlCookie,
  createConsentedUrlCookieSync,
  discardConsentedUrlValue,
} from './consented-url-cookie'

vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production')
  // The shared browser helpers also read this API during module initialization.
  window.matchMedia = vi.fn().mockReturnValue({ matches: false })
})

const COOKIE_VALUE = 'bfc_test_1.Opaque_Value.signature'
const SECOND_COOKIE_VALUE = 'bfc_test_1.Second_Value.signature'

function openPage(url = `https://supabase.com/?bfcid=${COOKIE_VALUE}`) {
  jsdom.reconfigure({ url })
  return jsdom
}

beforeEach(() => {
  // Undecided: the sync writes the cookie on an explicit `true` regardless of
  // proxy state, so this default lets both paths be exercised.
  consentState.isResolved = false
  consentState.showConsentToast = false
  consentState.hasConsented = false
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  jsdom.cookieJar.removeAllCookiesSync()
  sessionStorage.clear()
})

describe('consented URL cookie', () => {
  it('keeps the URL parameter in memory until consent, including after SPA navigation', () => {
    const page = openPage()
    const sync = createConsentedUrlCookieSync()

    sync(false)
    expect(document.cookie).toBe('')
    window.history.replaceState(null, '', '/next-page')
    sync(false)
    expect(document.cookie).toBe('')

    sync(true)
    expect(page.cookieJar.getCookieStringSync('https://subdomain.supabase.com/endpoint')).toBe(
      `bfcid=${COOKIE_VALUE}`
    )
  })

  it('recovers the parameter after a page load that happened before consent', () => {
    openPage()
    createConsentedUrlCookieSync()(false)
    expect(document.cookie).toBe('')

    // A new page load builds a fresh closure and the URL no longer carries the parameter.
    jsdom.reconfigure({ url: 'https://supabase.com/pricing' })
    const afterNavigation = createConsentedUrlCookieSync()
    afterNavigation(false)
    afterNavigation(true)

    expect(document.cookie).toBe(`bfcid=${COOKIE_VALUE}`)
  })

  it('drops the retained parameter once consent is denied', () => {
    openPage()
    createConsentedUrlCookieSync()(false)

    discardConsentedUrlValue()

    jsdom.reconfigure({ url: 'https://supabase.com/pricing' })
    createConsentedUrlCookieSync()(true)
    expect(document.cookie).toBe('')
  })

  it('does not throw when session storage is blocked', () => {
    openPage()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage access blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage access blocked')
    })

    const sync = createConsentedUrlCookieSync()
    expect(() => sync(false)).not.toThrow()
    expect(() => sync(true)).not.toThrow()
  })

  it('makes the unchanged cookie value available across subdomains and paths', () => {
    const page = openPage()
    createConsentedUrlCookieSync()(true)

    const cookies = page.cookieJar.getCookiesSync('https://subdomain.supabase.com/endpoint')
    expect(cookies).toHaveLength(1)
    expect(cookies[0]).toMatchObject({
      key: 'bfcid',
      value: COOKIE_VALUE,
      domain: 'supabase.com',
      path: '/',
      secure: true,
      sameSite: 'lax',
      maxAge: 2_592_000,
    })
    expect(page.cookieJar.getCookieStringSync('https://supabase.com/next-page')).toBe(
      `bfcid=${COOKIE_VALUE}`
    )
    expect(page.cookieJar.getCookieStringSync('https://example.com/')).toBe('')
    expect(page.cookieJar.getCookieStringSync('http://subdomain.supabase.com/endpoint')).toBe('')
  })

  it('preserves the cookie on later visits without refreshing its lifetime', () => {
    const page = openPage()
    createConsentedUrlCookieSync()(true)
    const writeCookie = vi.spyOn(document, 'cookie', 'set')

    createConsentedUrlCookieSync()(true)
    window.history.replaceState(null, '', '/next-page')
    createConsentedUrlCookieSync()(true)

    expect(writeCookie).not.toHaveBeenCalled()
    expect(page.cookieJar.getCookieStringSync('https://subdomain.supabase.com/')).toBe(
      `bfcid=${COOKIE_VALUE}`
    )
  })

  it('replaces the cookie when a new consented URL parameter arrives', () => {
    openPage()
    createConsentedUrlCookieSync()(true)
    window.history.replaceState(null, '', `/?bfcid=${SECOND_COOKIE_VALUE}`)
    createConsentedUrlCookieSync()(true)
    expect(document.cookie).toBe(`bfcid=${SECOND_COOKIE_VALUE}`)
  })

  it('does not erase a returning visitor’s cookie while consent initializes', () => {
    openPage()
    createConsentedUrlCookieSync()(true)
    window.history.replaceState(null, '', '/next-page')
    const sync = createConsentedUrlCookieSync()

    sync(false)
    sync(true)
    expect(document.cookie).toBe(`bfcid=${COOKIE_VALUE}`)
  })

  it('keeps the retained value while the banner is still showing', async () => {
    openPage()
    createConsentedUrlCookieSync()(false)
    expect(sessionStorage.getItem('sb-bfcid-pending')).not.toBeNull()

    consentState.isResolved = true
    consentState.showConsentToast = true

    await new Promise((resolve) => setTimeout(resolve, 10))
    // An undecided visitor may still accept, so the value waits for them.
    expect(sessionStorage.getItem('sb-bfcid-pending')).not.toBeNull()
  })

  it('clears an existing cookie when the decision resolves to no consent', async () => {
    openPage()
    createConsentedUrlCookieSync()(true)
    document.cookie = 'unrelated=keep; Path=/'

    consentState.isResolved = true
    consentState.showConsentToast = true

    await vi.waitFor(() => expect(document.cookie).toBe('unrelated=keep'))
  })

  // acceptAll sets hasConsented before the Usercentrics promise settles, so
  // the cookie is written optimistically. Its failure path flips consent back
  // and re-shows the banner, which has to take the cookie with it.
  it('clears the cookie when an optimistic acceptance is rolled back', async () => {
    openPage()
    createConsentedUrlCookieSync()(true)
    expect(document.cookie).toContain('bfcid=')

    consentState.isResolved = true
    consentState.hasConsented = false
    consentState.showConsentToast = true

    await vi.waitFor(() => expect(document.cookie).not.toContain('bfcid='))
  })

  it('discards the retained value once the visitor declines', async () => {
    openPage()
    createConsentedUrlCookieSync()(false)
    expect(sessionStorage.getItem('sb-bfcid-pending')).not.toBeNull()

    consentState.isResolved = true

    await vi.waitFor(() => expect(sessionStorage.getItem('sb-bfcid-pending')).toBeNull())
    expect(document.cookie).not.toContain('bfcid=')
  })

  it('does not clear anything before the consent decision resolves', async () => {
    openPage()
    createConsentedUrlCookieSync()(true)

    consentState.isResolved = false
    consentState.hasConsented = false

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(document.cookie).toContain('bfcid=')
  })

  it('clears host-only and shared cookies for an explicit denial', () => {
    const page = openPage()
    createConsentedUrlCookieSync()(true)
    document.cookie = `bfcid=${SECOND_COOKIE_VALUE}; Path=/`

    clearConsentedUrlCookie()
    expect(document.cookie).toBe('')
    expect(page.cookieJar.getCookieStringSync('https://subdomain.supabase.com/')).toBe('')
  })

  it.each([
    '',
    '?bfcid=',
    '?bfcid=bfc_',
    '?bfcid=invalid-value',
    '?bfcid=bfc_unsafe%3Bvalue',
    '?bfcid=bfc_unsafe%0A',
    '?bfcid=bfc_unsafe%0D',
    '?bfcid=bfc_unsafe+value',
    `?bfcid=bfc_${'a'.repeat(509)}`,
    `?bfcid=${COOKIE_VALUE}&bfcid=${SECOND_COOKIE_VALUE}`,
  ])('does not store missing, ambiguous or unsafe values: %s', (query) => {
    openPage(`https://supabase.com/${query}`)
    createConsentedUrlCookieSync()(true)
    expect(document.cookie).toBe('')
  })

  it('preserves the full 512-character identifier without truncation', () => {
    // Freebuff validates with /^bfc_[A-Za-z0-9._-]{1,508}$/, so anything
    // longer would be stored here and then rejected by them.
    const cookieValue = `bfc_${'a'.repeat(508)}`
    openPage(`https://supabase.com/?bfcid=${cookieValue}`)
    createConsentedUrlCookieSync()(true)
    expect(document.cookie).toBe(`bfcid=${cookieValue}`)
  })

  it.each(['http://localhost:3000', 'https://preview.example.com', 'https://supabase.com.example'])(
    'uses host-only storage on a development or preview origin: %s',
    (origin) => {
      const page = openPage(`${origin}/?bfcid=${COOKIE_VALUE}`)
      createConsentedUrlCookieSync()(true)
      expect(document.cookie).toBe(`bfcid=${COOKIE_VALUE}`)
      expect(page.cookieJar.getCookiesSync(origin)[0].hostOnly).toBe(true)
      expect(page.cookieJar.getCookieStringSync('https://subdomain.supabase.com/')).toBe('')
    }
  )

  it('follows the shared host-only policy for preview deployments on a Supabase subdomain', async () => {
    const page = openPage(`https://preview.supabase.com/?bfcid=${COOKIE_VALUE}`)
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    vi.resetModules()

    try {
      const { createConsentedUrlCookieSync: createPreviewCookieSync } =
        await import('./consented-url-cookie')
      createPreviewCookieSync()(true)

      expect(document.cookie).toBe(`bfcid=${COOKIE_VALUE}`)
      expect(page.cookieJar.getCookiesSync('https://preview.supabase.com/')[0].hostOnly).toBe(true)
      expect(page.cookieJar.getCookieStringSync('https://subdomain.supabase.com/')).toBe('')
    } finally {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production')
    }
  })

  it('does not throw during cookie setup or consent changes when storage is blocked', () => {
    openPage()
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
      throw new Error('Cookie access blocked')
    })
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
      throw new Error('Cookie access blocked')
    })

    const sync = createConsentedUrlCookieSync()
    expect(() => sync(true)).not.toThrow()
    expect(() => sync(false)).not.toThrow()
    expect(() => clearConsentedUrlCookie()).not.toThrow()
  })

  it('does not access browser globals during server rendering', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)
    expect(() => createConsentedUrlCookieSync()(true)).not.toThrow()
    expect(() => clearConsentedUrlCookie()).not.toThrow()
  })
})
