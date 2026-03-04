import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { FIRST_REFERRER_COOKIE_NAME } from 'common/first-referrer-cookie'

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

  describe('dashboard/docs instrumentation guard', () => {
    it('sets x-sb-mw-hit header on /dashboard paths', () => {
      const req = makeRequest('/dashboard/project/123', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.headers.get('x-sb-mw-hit')).toBe('1')
    })

    it('sets x-sb-mw-hit header on /docs paths', () => {
      const req = makeRequest('/docs/guides/auth', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.headers.get('x-sb-mw-hit')).toBe('1')
    })

    it('does NOT stamp cookie on /dashboard paths', () => {
      const req = makeRequest('/dashboard/project/123', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })

    it('does NOT stamp cookie on /docs paths', () => {
      const req = makeRequest('/docs/guides/auth', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })

    it('does NOT set x-sb-mw-hit header on normal www paths', () => {
      const req = makeRequest('/pricing', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.headers.get('x-sb-mw-hit')).toBeNull()
    })
  })
})
