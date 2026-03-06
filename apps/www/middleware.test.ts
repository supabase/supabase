import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { FIRST_REFERRER_COOKIE_NAME, MW_DIAG_COOKIE_NAME } from 'common/first-referrer-cookie'

import { middleware } from './middleware'

function makeRequest(
  url: string,
  { referer, hasCookie }: { referer?: string; hasCookie?: boolean } = {}
): NextRequest {
  const req = new NextRequest(new URL(url, 'https://supabase.com'), {
    headers: referer ? { referer } : {},
  })
  if (hasCookie) {
    req.cookies.set(FIRST_REFERRER_COOKIE_NAME, 'existing')
  }
  return req
}

function parseDiagCookie(value: string) {
  const params = new URLSearchParams(value)
  return {
    hit: params.get('hit') === '1',
    would_stamp: params.get('would_stamp') === '1',
    has_cookie: params.get('has_cookie') === '1',
  }
}

describe('www middleware', () => {
  describe('cookie stamping on normal paths', () => {
    it('stamps cookie for external referrer on www path', () => {
      const req = makeRequest('/pricing', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeDefined()
    })

    it('does not stamp cookie for internal referrer', () => {
      const req = makeRequest('/pricing', { referer: 'https://supabase.com/docs' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })
  })

  describe('dashboard/docs diagnostic guard', () => {
    it('sets diagnostic cookie on /dashboard paths', () => {
      const req = makeRequest('/dashboard/project/123', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(MW_DIAG_COOKIE_NAME)).toBeDefined()
    })

    it('sets diagnostic cookie on /docs paths', () => {
      const req = makeRequest('/docs/guides/auth', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(MW_DIAG_COOKIE_NAME)).toBeDefined()
    })

    it('encodes hit=1 in diagnostic cookie', () => {
      const req = makeRequest('/dashboard/project/123', { referer: 'https://google.com' })
      const res = middleware(req)
      const raw = res.cookies.get(MW_DIAG_COOKIE_NAME)?.value ?? ''
      const diag = parseDiagCookie(raw)

      expect(diag.hit).toBe(true)
    })

    it('encodes would_stamp=1 for external referrer with no existing cookie', () => {
      const req = makeRequest('/dashboard/project/123', { referer: 'https://google.com' })
      const res = middleware(req)
      const raw = res.cookies.get(MW_DIAG_COOKIE_NAME)?.value ?? ''
      const diag = parseDiagCookie(raw)

      expect(diag.would_stamp).toBe(true)
      expect(diag.has_cookie).toBe(false)
    })

    it('encodes would_stamp=0 for direct navigation (no referrer)', () => {
      const req = makeRequest('/dashboard/project/123')
      const res = middleware(req)
      const raw = res.cookies.get(MW_DIAG_COOKIE_NAME)?.value ?? ''
      const diag = parseDiagCookie(raw)

      expect(diag.would_stamp).toBe(false)
      expect(diag.has_cookie).toBe(false)
    })

    it('encodes would_stamp=0 for internal referrer', () => {
      const req = makeRequest('/dashboard/project/123', {
        referer: 'https://supabase.com/pricing',
      })
      const res = middleware(req)
      const raw = res.cookies.get(MW_DIAG_COOKIE_NAME)?.value ?? ''
      const diag = parseDiagCookie(raw)

      expect(diag.would_stamp).toBe(false)
    })

    it('encodes has_cookie=1 when first-referrer cookie is already present', () => {
      const req = makeRequest('/dashboard/project/123', {
        referer: 'https://google.com',
        hasCookie: true,
      })
      const res = middleware(req)
      const raw = res.cookies.get(MW_DIAG_COOKIE_NAME)?.value ?? ''
      const diag = parseDiagCookie(raw)

      expect(diag.has_cookie).toBe(true)
    })

    it('does NOT stamp first-referrer cookie on /dashboard paths', () => {
      const req = makeRequest('/dashboard/project/123', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })

    it('does NOT stamp first-referrer cookie on /docs paths', () => {
      const req = makeRequest('/docs/guides/auth', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })

    it('does NOT set diagnostic cookie on normal www paths', () => {
      const req = makeRequest('/pricing', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(MW_DIAG_COOKIE_NAME)).toBeUndefined()
    })
  })
})
