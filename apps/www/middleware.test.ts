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

  describe('Accept header q-value parsing', () => {
    it('serves markdown for Cursor-style Accept (markdown preferred, plain fallback)', () => {
      const req = makeRequest('/auth', {
        accept: 'text/markdown, text/plain;q=0.9, */*;q=0.8',
      })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('serves markdown when md and html have equal q-values', () => {
      const req = makeRequest('/auth', { accept: 'text/markdown, text/html, */*' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('serves HTML when html q-value beats markdown q-value', () => {
      const req = makeRequest('/auth', { accept: 'text/html;q=1.0, text/markdown;q=0.5' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })

    it('serves HTML for browser-style Accept (html with */* fallback)', () => {
      const req = makeRequest('/auth', {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })

    it('serves markdown when md q-value beats html q-value', () => {
      const req = makeRequest('/auth', { accept: 'text/html;q=0.5, text/markdown;q=1.0' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })

    it('tolerates OWS around the q parameter (per RFC 9110)', () => {
      const req = makeRequest('/auth', { accept: 'text/html ; q = 1.0, text/markdown ; q = 0.5' })
      const res = middleware(req)

      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })

    it('ignores out-of-range q-values rather than treating them as preference', () => {
      const req = makeRequest('/auth', { accept: 'text/html;q=2.0, text/markdown;q=1.0' })
      const res = middleware(req)

      // text/html's q=2.0 is invalid and falls back to default 1.0; tie -> markdown.
      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/auth')
    })
  })

  describe('406 Not Acceptable', () => {
    it('returns 406 on MD-eligible page when Accept excludes every type we serve', () => {
      const req = makeRequest('/pricing', { accept: 'application/x-content-negotiation-probe' })
      const res = middleware(req)

      expect(res.status).toBe(406)
      expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    })

    it('does not return 406 on non-MD pages (no negotiation contract there)', () => {
      const req = makeRequest('/not-a-page', { accept: 'application/x-content-negotiation-probe' })
      const res = middleware(req)

      expect(res.status).not.toBe(406)
    })

    it('does not return 406 when Accept includes */*', () => {
      const req = makeRequest('/pricing', { accept: '*/*' })
      const res = middleware(req)

      expect(res.status).not.toBe(406)
    })

    it('does not return 406 for LLM UAs even with a probe Accept header', () => {
      const req = makeRequest('/pricing', {
        accept: 'application/x-content-negotiation-probe',
        userAgent: 'Claude-User/1.0',
      })
      const res = middleware(req)

      expect(res.status).not.toBe(406)
      expect(res.headers.get('x-middleware-rewrite')).toBe('https://supabase.com/api-v2/md/pricing')
    })

    it('returns 406 on changelog entries when Accept excludes every type', () => {
      const req = makeRequest('/changelog/100', {
        accept: 'application/x-content-negotiation-probe',
      })
      const res = middleware(req)

      expect(res.status).toBe(406)
    })

    it('sets Cache-Control: no-store and Vary: Accept on 406 responses', () => {
      const req = makeRequest('/pricing', { accept: 'application/x-content-negotiation-probe' })
      const res = middleware(req)

      expect(res.status).toBe(406)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      expect(res.headers.get('Vary')).toBe('Accept')
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
