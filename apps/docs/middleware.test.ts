import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { middleware } from './middleware'

// BASE_PATH defaults to '/docs' when NEXT_PUBLIC_BASE_PATH is unset, so test
// paths include the /docs prefix to match the middleware's GUIDES_PATH check.
function makeRequest(
  path: string,
  { accept, userAgent }: { accept?: string; userAgent?: string } = {}
): NextRequest {
  const headers: Record<string, string> = {}
  if (accept) headers.accept = accept
  if (userAgent) headers['user-agent'] = userAgent
  return new NextRequest(new URL(path, 'https://supabase.com'), { headers })
}

const REWRITE_HEADER = 'x-middleware-rewrite'
const GUIDES_MD_REWRITE = (slug: string) => `https://supabase.com/docs/api/guides-md/${slug}`

describe('docs middleware — /guides/* content negotiation', () => {
  describe('Accept: text/markdown', () => {
    it('rewrites to /api/guides-md/<slug> on bare text/markdown Accept', () => {
      const req = makeRequest('/docs/guides/auth', { accept: 'text/markdown' })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('handles nested slugs', () => {
      const req = makeRequest('/docs/guides/auth/social-login/auth-google', {
        accept: 'text/markdown',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(
        GUIDES_MD_REWRITE('auth/social-login/auth-google')
      )
    })

    it('falls through to HTML when Accept does not include text/markdown', () => {
      const req = makeRequest('/docs/guides/auth', { accept: 'text/html' })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })
  })

  describe('.md suffix routing', () => {
    it('rewrites /guides/<slug>.md to /api/guides-md/<slug>', () => {
      const req = makeRequest('/docs/guides/auth.md')
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('rewrites /guides/<slug>.md regardless of Accept header', () => {
      const req = makeRequest('/docs/guides/auth.md', { accept: 'text/html' })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })
  })

  describe('q-value parsing', () => {
    it('serves markdown for Cursor-style Accept (markdown preferred, plain fallback)', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/markdown, text/plain;q=0.9, */*;q=0.8',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('serves markdown when md and html have equal q-values', () => {
      const req = makeRequest('/docs/guides/auth', { accept: 'text/markdown, text/html, */*' })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('serves HTML when html q-value beats markdown q-value', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/html;q=1.0, text/markdown;q=0.5',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })

    it('serves HTML for browser-style Accept (html with */* fallback)', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })

    it('serves markdown when md q-value beats html q-value', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/html;q=0.5, text/markdown;q=1.0',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('tolerates OWS around the q parameter (per RFC 9110)', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/html ; q = 1.0, text/markdown ; q = 0.5',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })

    it('ignores out-of-range q-values rather than treating them as preference', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/html;q=2.0, text/markdown;q=1.0',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('falls through to HTML when no Accept header is sent (browser default)', () => {
      const req = makeRequest('/docs/guides/auth')
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })

    it('falls through to HTML for bare Accept: */* (no explicit md preference)', () => {
      const req = makeRequest('/docs/guides/auth', { accept: '*/*' })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })

    it('does not serve markdown when client explicitly rejects it (q=0)', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/markdown;q=0, text/html;q=1.0',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })
  })

  describe('406 Not Acceptable', () => {
    it('returns 406 when Accept excludes every type we serve', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'application/x-content-negotiation-probe',
      })
      const res = middleware(req)

      expect(res.status).toBe(406)
      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })

    it('does not 406 when Accept includes */*', () => {
      const req = makeRequest('/docs/guides/auth', { accept: '*/*' })
      const res = middleware(req)

      expect(res.status).not.toBe(406)
    })

    it('does not 406 for LLM UAs even with a probe Accept header', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'application/x-content-negotiation-probe',
        userAgent: 'Claude-User/1.0',
      })
      const res = middleware(req)

      expect(res.status).not.toBe(406)
      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('does not 406 on .md suffix paths (explicit markdown request)', () => {
      const req = makeRequest('/docs/guides/auth.md', {
        accept: 'application/x-content-negotiation-probe',
      })
      const res = middleware(req)

      expect(res.status).not.toBe(406)
      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('sets Cache-Control: no-store and Vary: Accept on 406 responses', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'application/x-content-negotiation-probe',
      })
      const res = middleware(req)

      expect(res.status).toBe(406)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      expect(res.headers.get('Vary')).toBe('Accept')
    })

    it('does not 406 on /reference/* paths (negotiation contract is /guides/* only)', () => {
      const req = makeRequest('/docs/reference/javascript/introduction', {
        accept: 'application/x-content-negotiation-probe',
      })
      const res = middleware(req)

      expect(res.status).not.toBe(406)
    })
  })

  describe('LLM user-agent routing', () => {
    it('rewrites for Claude-User on /guides/*', () => {
      const req = makeRequest('/docs/guides/auth', {
        userAgent: 'Claude-User (claude-code/2.1.119; +https://support.anthropic.com/)',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('rewrites for Claude-Web', () => {
      const req = makeRequest('/docs/guides/auth', { userAgent: 'Claude-Web/1.0' })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('rewrites for ChatGPT-User', () => {
      const req = makeRequest('/docs/guides/auth', {
        userAgent: 'Mozilla/5.0 (compatible; ChatGPT-User/1.0)',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('rewrites for PerplexityBot', () => {
      const req = makeRequest('/docs/guides/auth', { userAgent: 'PerplexityBot/1.0' })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('rewrites for LLM UA even when Accept prefers HTML', () => {
      const req = makeRequest('/docs/guides/auth', {
        accept: 'text/html;q=1.0, text/markdown;q=0.1',
        userAgent: 'Claude-User/1.0',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    })

    it('falls through for browser user agents', () => {
      const req = makeRequest('/docs/guides/auth', {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      })
      const res = middleware(req)

      expect(res.headers.get(REWRITE_HEADER)).toBeNull()
    })

    it('falls through for training crawlers (GPTBot, ClaudeBot, CCBot)', () => {
      for (const ua of ['GPTBot/1.0', 'ClaudeBot/1.0', 'CCBot/2.0']) {
        const req = makeRequest('/docs/guides/auth', { userAgent: ua })
        const res = middleware(req)

        expect(res.headers.get(REWRITE_HEADER)).toBeNull()
      }
    })

    it('falls through for UAs that embed a match as a substring', () => {
      for (const ua of ['chatgpt-userscript/2.0', 'NotPerplexityBot']) {
        const req = makeRequest('/docs/guides/auth', { userAgent: ua })
        const res = middleware(req)

        expect(res.headers.get(REWRITE_HEADER)).toBeNull()
      }
    })

    it('does not apply LLM UA rewrite to /reference/* paths (guides-only)', () => {
      const req = makeRequest('/docs/reference/javascript/introduction', {
        userAgent: 'Claude-User/1.0',
      })
      const res = middleware(req)

      const rewrite = res.headers.get(REWRITE_HEADER)
      expect(rewrite).not.toContain('/api/guides-md/')
    })
  })
})
