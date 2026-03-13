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
  describe('cookie stamping on www paths', () => {
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

  describe('cookie stamping on /dashboard paths', () => {
    it('stamps cookie for external referrer', () => {
      const req = makeRequest('/dashboard/project/123', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeDefined()
    })

    it('does not stamp cookie for internal referrer', () => {
      const req = makeRequest('/dashboard/project/123', {
        referer: 'https://supabase.com/pricing',
      })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })

    it('does not stamp cookie for direct navigation (no referrer)', () => {
      const req = makeRequest('/dashboard/project/123')
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })
  })

  describe('cookie stamping on /docs paths', () => {
    it('stamps cookie for external referrer', () => {
      const req = makeRequest('/docs/guides/auth', { referer: 'https://google.com' })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeDefined()
    })

    it('does not stamp cookie for internal referrer', () => {
      const req = makeRequest('/docs/guides/auth', {
        referer: 'https://supabase.com/pricing',
      })
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })

    it('does not stamp cookie for direct navigation (no referrer)', () => {
      const req = makeRequest('/docs/guides/auth')
      const res = middleware(req)

      expect(res.cookies.get(FIRST_REFERRER_COOKIE_NAME)).toBeUndefined()
    })
  })
})
