import { FIRST_REFERRER_COOKIE_NAME } from 'common/first-referrer-cookie'
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { middleware } from './middleware'

// content.generated.ts is produced by scripts/generateMdContent.mjs at
// content:build time and gitignored, so it isn't on disk in CI before tests
// run. The mock seeds a representative allowlist so the .md-routing branches
// are actually exercised below.
vi.mock('./app/api-v2/md/content.generated', () => ({
  MD_CONTENT: new Map<string, string>(),
  MD_PAGES: new Set<string>(['homepage', 'auth', 'pricing']),
}))

function makeRequest(
  url: string,
  {
    referer,
    hasCookie,
    accept,
    userAgent,
  }: { referer?: string; hasCookie?: boolean; accept?: string; userAgent?: string } = {}
): NextRequest {
  const headers: Record<string, string> = {}
  if (referer) headers.referer = referer
  if (accept) headers.accept = accept
  if (userAgent) headers['user-agent'] = userAgent
  const req = new NextRequest(new URL(url, 'https://supabase.com'), { headers })
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

  describe('.md suffix routing', () => {
    it('rewrites /<slug>.md for allowlisted slugs', () => {
      const req = makeRequest('/auth.md')
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('falls through for non-allowlisted .md slugs', () => {
      const req = makeRequest('/not-a-page.md')
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })
  })

  describe('Accept: text/markdown content negotiation', () => {
    it('rewrites / to homepage when Accept: text/markdown', () => {
      const req = makeRequest('/', { accept: 'text/markdown' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe(
        'https://supabase.com/api-v2/md/homepage'
      )
    })

    it('rewrites /<slug> when Accept: text/markdown matches the allowlist', () => {
      const req = makeRequest('/auth', { accept: 'text/markdown' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('rewrites /<slug>/ (trailing slash) the same as /<slug>', () => {
      const req = makeRequest('/auth/', { accept: 'text/markdown' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('falls through when Accept does not include text/markdown', () => {
      const req = makeRequest('/auth', { accept: 'text/html' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })

    it('falls through when slug is not in the allowlist', () => {
      const req = makeRequest('/not-a-page', { accept: 'text/markdown' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })
  })

  describe('LLM user-agent routing', () => {
    it('rewrites for Claude-User', () => {
      const req = makeRequest('/pricing', {
        userAgent: 'Claude-User (claude-code/2.1.119; +https://support.anthropic.com/)',
      })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/pricing')
    })

    it('rewrites for ChatGPT-User', () => {
      const req = makeRequest('/auth', { userAgent: 'Mozilla/5.0 (compatible; ChatGPT-User/1.0)' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('rewrites for Claude-Web', () => {
      const req = makeRequest('/pricing', { userAgent: 'Claude-Web/1.0' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/pricing')
    })

    it('rewrites for PerplexityBot', () => {
      const req = makeRequest('/auth/', { userAgent: 'PerplexityBot/1.0' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('falls through for UAs that embed a match as a substring', () => {
      for (const ua of ['chatgpt-userscript/2.0', 'NotPerplexityBot']) {
        const req = makeRequest('/auth', { userAgent: ua })
        const res = middleware(req)

        expect(res.headers.get('x-middleware-rewrite')).toBeNull()
      }
    })

    it('falls through for browser user agents', () => {
      const req = makeRequest('/auth', {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })

    it('falls through for training crawlers (GPTBot, ClaudeBot, CCBot)', () => {
      for (const ua of ['GPTBot/1.0', 'ClaudeBot/1.0', 'CCBot/2.0']) {
        const req = makeRequest('/auth', { userAgent: ua })
        const res = middleware(req)

        expect(res.headers.get('x-middleware-rewrite')).toBeNull()
      }
    })

    it('falls through when slug is not in the allowlist', () => {
      const req = makeRequest('/not-a-page', { userAgent: 'Claude-User' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })
  })
})
