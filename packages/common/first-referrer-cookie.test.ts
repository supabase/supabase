import { describe, expect, it } from 'vitest'

import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_NAME,
  hasPaidSignals,
  isExternalReferrer,
  isOAuthRedirectReferrer,
  MW_DIAG_COOKIE_NAME,
  parseFirstReferrerCookie,
  parseMwDiagCookie,
  serializeFirstReferrerCookie,
  shouldRefreshCookie,
} from './first-referrer-cookie'

describe('first-referrer-cookie', () => {
  describe('isExternalReferrer', () => {
    it('returns false for supabase domains', () => {
      expect(isExternalReferrer('https://supabase.com')).toBe(false)
      expect(isExternalReferrer('https://www.supabase.com')).toBe(false)
      expect(isExternalReferrer('https://docs.supabase.com')).toBe(false)
    })

    it('returns true for external domains', () => {
      expect(isExternalReferrer('https://google.com')).toBe(true)
      expect(isExternalReferrer('https://chatgpt.com')).toBe(true)
    })

    it('returns true for http:// referrers', () => {
      expect(isExternalReferrer('http://google.com')).toBe(true)
      expect(isExternalReferrer('http://example.org/page')).toBe(true)
    })

    it('returns false for invalid values', () => {
      expect(isExternalReferrer('')).toBe(false)
      expect(isExternalReferrer('not-a-url')).toBe(false)
    })
  })

  describe('isOAuthRedirectReferrer', () => {
    // Google SSO — block entire domain
    it('returns true for accounts.google.com (bare)', () => {
      expect(isOAuthRedirectReferrer('https://accounts.google.com/')).toBe(true)
    })

    it('returns true for accounts.google.com with path', () => {
      expect(
        isOAuthRedirectReferrer('https://accounts.google.com/o/oauth2/auth?client_id=abc')
      ).toBe(true)
    })

    // GitHub OAuth — block bare domain only
    it('returns true for bare github.com/', () => {
      expect(isOAuthRedirectReferrer('https://github.com/')).toBe(true)
    })

    it('returns true for bare github.com (no trailing slash)', () => {
      expect(isOAuthRedirectReferrer('https://github.com')).toBe(true)
    })

    // GitHub genuine referrals — preserve these
    it('returns false for github.com with repo path', () => {
      expect(isOAuthRedirectReferrer('https://github.com/supabase/supabase')).toBe(false)
    })

    it('returns false for github.com with README path', () => {
      expect(
        isOAuthRedirectReferrer('https://github.com/supabase/supabase?tab=readme-ov-file')
      ).toBe(false)
    })

    it('returns false for github.com with discussion path', () => {
      expect(isOAuthRedirectReferrer('https://github.com/orgs/supabase/discussions/42949')).toBe(
        false
      )
    })

    it('returns false for github.com with blob path', () => {
      expect(
        isOAuthRedirectReferrer('https://github.com/supabase/supabase/blob/master/README.md')
      ).toBe(false)
    })

    // GitHub OAuth explicit path (rare, but should still be caught)
    it('returns true for github.com/login/oauth/authorize', () => {
      expect(
        isOAuthRedirectReferrer('https://github.com/login/oauth/authorize?client_id=abc')
      ).toBe(true)
    })

    // Non-OAuth domains — should not match
    it('returns false for google.com (search)', () => {
      expect(isOAuthRedirectReferrer('https://www.google.com/')).toBe(false)
    })

    it('returns false for claude.ai', () => {
      expect(isOAuthRedirectReferrer('https://claude.ai/')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isOAuthRedirectReferrer('')).toBe(false)
    })

    it('returns false for malformed URL', () => {
      expect(isOAuthRedirectReferrer('not-a-url')).toBe(false)
    })
  })

  describe('buildFirstReferrerData', () => {
    it('handles malformed landing URL gracefully', () => {
      const data = buildFirstReferrerData({
        referrer: 'https://google.com',
        landingUrl: 'not-a-valid-url',
      })

      expect(data.referrer).toBe('https://google.com')
      expect(data.landing_url).toBe('not-a-valid-url')
      expect(data.utms).toEqual({})
      expect(data.click_ids).toEqual({})
    })

    it('extracts utm and click-id params from landing url', () => {
      const data = buildFirstReferrerData({
        referrer: 'https://www.google.com/',
        landingUrl:
          'https://supabase.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=abc123&msclkid=xyz456',
      })

      expect(data.referrer).toBe('https://www.google.com/')
      expect(data.landing_url).toBe(
        'https://supabase.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=abc123&msclkid=xyz456'
      )

      expect(data.utms).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test',
      })

      expect(data.click_ids).toEqual({
        gclid: 'abc123',
        msclkid: 'xyz456',
      })
    })
  })

  describe('serialize / parse', () => {
    it('round-trips valid cookie payloads', () => {
      const input = buildFirstReferrerData({
        referrer: 'https://www.google.com/',
        landingUrl: 'https://supabase.com/pricing?utm_source=google',
      })

      const encoded = serializeFirstReferrerCookie(input)
      const parsed = parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=${encoded}`)

      expect(parsed).toEqual(input)
    })

    it('returns null for empty string', () => {
      expect(parseFirstReferrerCookie('')).toBeNull()
    })

    it('parses cookie from header with multiple cookies', () => {
      const input = buildFirstReferrerData({
        referrer: 'https://google.com/',
        landingUrl: 'https://supabase.com/',
      })
      const encoded = serializeFirstReferrerCookie(input)
      const header = `session=abc123; ${FIRST_REFERRER_COOKIE_NAME}=${encoded}; theme=dark`

      expect(parseFirstReferrerCookie(header)).toEqual(input)
    })

    it('returns null for malformed json', () => {
      expect(parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=%7Bnot-json`)).toBeNull()
    })

    it('returns null for invalid payload shape', () => {
      const encoded = encodeURIComponent(JSON.stringify({ foo: 'bar' }))
      expect(parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=${encoded}`)).toBeNull()
    })

    it('parses double-encoded cookies (legacy format before serializer fix)', () => {
      const input = buildFirstReferrerData({
        referrer: 'https://www.google.com/',
        landingUrl: 'https://supabase.com/pricing?utm_source=google',
      })

      // Simulate the old double-encoding: encodeURIComponent(JSON.stringify(data))
      // followed by Next.js cookies.set() encoding it again.
      const doubleEncoded = encodeURIComponent(encodeURIComponent(JSON.stringify(input)))
      const parsed = parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=${doubleEncoded}`)

      expect(parsed).toEqual(input)
    })

    it('drops non-string values in utms/click_ids', () => {
      const encoded = encodeURIComponent(
        JSON.stringify({
          referrer: 'https://www.google.com/',
          landing_url: 'https://supabase.com/pricing',
          utms: { utm_source: 'google', utm_medium: 123 },
          click_ids: { gclid: 'abc', msclkid: null },
          ts: 123,
        })
      )

      const parsed = parseFirstReferrerCookie(`${FIRST_REFERRER_COOKIE_NAME}=${encoded}`)

      expect(parsed).toEqual({
        referrer: 'https://www.google.com/',
        landing_url: 'https://supabase.com/pricing',
        utms: { utm_source: 'google' },
        click_ids: { gclid: 'abc' },
        ts: 123,
      })
    })
  })

  describe('hasPaidSignals', () => {
    it('detects click IDs', () => {
      expect(hasPaidSignals(new URL('https://supabase.com/?gclid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?fbclid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?msclkid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?gbraid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?wbraid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?rdt_cid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?ttclid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?twclid=abc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?li_fat_id=abc'))).toBe(true)
    })

    it('detects paid utm_medium values', () => {
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=cpc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=ppc'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=paid_search'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=paidsocial'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=paid_social'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=display'))).toBe(true)
    })

    it('is case-insensitive for utm_medium', () => {
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=CPC'))).toBe(true)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=Paid_Search'))).toBe(true)
    })

    it('returns false for organic traffic', () => {
      expect(hasPaidSignals(new URL('https://supabase.com/'))).toBe(false)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_source=google'))).toBe(false)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=email'))).toBe(false)
      expect(hasPaidSignals(new URL('https://supabase.com/?utm_medium=organic'))).toBe(false)
    })
  })

  describe('parseMwDiagCookie', () => {
    it('parses well-formed value with would_stamp=1 and has_cookie=0', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=hit=1&would_stamp=1&has_cookie=0`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: true,
        has_existing_cookie: false,
      })
    })

    it('parses well-formed value with would_stamp=0 and has_cookie=1', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=hit=1&would_stamp=0&has_cookie=1`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: false,
        has_existing_cookie: true,
      })
    })

    it('returns null when hit=0', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=hit=0&would_stamp=1&has_cookie=1`
      expect(parseMwDiagCookie(header)).toBeNull()
    })

    it('returns object with would_stamp: false when would_stamp key is missing', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=hit=1&has_cookie=1`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: false,
        has_existing_cookie: true,
      })
    })

    it('returns object with has_existing_cookie: false when has_cookie key is missing', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=hit=1&would_stamp=1`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: true,
        has_existing_cookie: false,
      })
    })

    it('returns null for empty string input', () => {
      expect(parseMwDiagCookie('')).toBeNull()
    })

    it('returns null when cookie is not present in header', () => {
      expect(parseMwDiagCookie('session=abc123; theme=dark')).toBeNull()
    })

    it('returns null for garbage value', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=not-a-valid-query-string`
      expect(parseMwDiagCookie(header)).toBeNull()
    })

    it('parses correct cookie from header with multiple cookies', () => {
      const header = `session=abc123; ${MW_DIAG_COOKIE_NAME}=hit=1&would_stamp=1&has_cookie=0; theme=dark`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: true,
        has_existing_cookie: false,
      })
    })

    it('parses URL-encoded value from Next.js response.cookies.set()', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=hit%3D1%26would_stamp%3D1%26has_cookie%3D0`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: true,
        has_existing_cookie: false,
      })
    })

    it('parses URL-encoded value with has_cookie=1', () => {
      const header = `${MW_DIAG_COOKIE_NAME}=hit%3D1%26would_stamp%3D0%26has_cookie%3D1`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: false,
        has_existing_cookie: true,
      })
    })

    it('parses URL-encoded value among multiple cookies', () => {
      const header = `session=abc; ${MW_DIAG_COOKIE_NAME}=hit%3D1%26would_stamp%3D0%26has_cookie%3D0; theme=dark`
      expect(parseMwDiagCookie(header)).toEqual({
        hit: true,
        would_stamp: false,
        has_existing_cookie: false,
      })
    })
  })

  describe('shouldRefreshCookie', () => {
    it('stamps when no cookie and external referrer', () => {
      expect(
        shouldRefreshCookie(false, {
          referrer: 'https://google.com',
          url: 'https://supabase.com/',
        })
      ).toEqual({ stamp: true })
    })

    it('skips when no cookie and internal referrer', () => {
      expect(
        shouldRefreshCookie(false, {
          referrer: 'https://supabase.com/docs',
          url: 'https://supabase.com/dashboard',
        })
      ).toEqual({ stamp: false })
    })

    it('skips when cookie exists and no paid signals', () => {
      expect(
        shouldRefreshCookie(true, {
          referrer: 'https://google.com',
          url: 'https://supabase.com/',
        })
      ).toEqual({ stamp: false })
    })

    it('refreshes when cookie exists but URL has paid signals', () => {
      expect(
        shouldRefreshCookie(true, {
          referrer: 'https://google.com',
          url: 'https://supabase.com/?gclid=abc123',
        })
      ).toEqual({ stamp: true })

      expect(
        shouldRefreshCookie(true, {
          referrer: 'https://google.com',
          url: 'https://supabase.com/?utm_medium=cpc&utm_source=google',
        })
      ).toEqual({ stamp: true })
    })

    it('skips when no cookie and no referrer (direct navigation)', () => {
      expect(shouldRefreshCookie(false, { referrer: '', url: 'https://supabase.com/' })).toEqual({
        stamp: false,
      })
    })

    it('handles malformed URL gracefully', () => {
      expect(
        shouldRefreshCookie(true, {
          referrer: 'https://google.com',
          url: 'not-a-valid-url',
        })
      ).toEqual({ stamp: false })
    })

    it('does not stamp for GitHub OAuth redirect (bare domain)', () => {
      const result = shouldRefreshCookie(false, {
        referrer: 'https://github.com/',
        url: 'https://supabase.com/dashboard',
      })
      expect(result.stamp).toBe(false)
    })

    it('does not stamp for Google SSO redirect', () => {
      const result = shouldRefreshCookie(false, {
        referrer: 'https://accounts.google.com/',
        url: 'https://supabase.com/dashboard',
      })
      expect(result.stamp).toBe(false)
    })

    it('still stamps for genuine GitHub referral with path', () => {
      const result = shouldRefreshCookie(false, {
        referrer: 'https://github.com/supabase/supabase?tab=readme-ov-file',
        url: 'https://supabase.com/',
      })
      expect(result.stamp).toBe(true)
    })

    it('still re-stamps existing cookie for paid signals regardless of OAuth referrer', () => {
      const result = shouldRefreshCookie(true, {
        referrer: 'https://github.com/',
        url: 'https://supabase.com/pricing?gclid=abc123',
      })
      expect(result.stamp).toBe(true)
    })
  })
})
