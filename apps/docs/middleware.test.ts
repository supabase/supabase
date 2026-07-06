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
  it('rewrites to /api/guides-md/<slug> when Accept includes text/markdown', () => {
    const req = makeRequest('/docs/guides/auth', { accept: 'text/markdown' })
    expect(middleware(req).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
  })

  it('rewrites /<slug>.md to /api/guides-md/<slug> regardless of Accept', () => {
    for (const accept of [undefined, 'text/html']) {
      const req = makeRequest('/docs/guides/auth.md', accept ? { accept } : {})
      expect(middleware(req).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    }
  })

  it('serves HTML for browser-style Accept', () => {
    const req = makeRequest('/docs/guides/auth', {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    })
    expect(middleware(req).headers.get(REWRITE_HEADER)).toBeNull()
  })

  it('serves markdown when md q-value beats html', () => {
    const req = makeRequest('/docs/guides/auth', {
      accept: 'text/html;q=0.5, text/markdown;q=1.0',
    })
    expect(middleware(req).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
  })

  it('falls through to HTML when no Accept header is sent', () => {
    expect(middleware(makeRequest('/docs/guides/auth')).headers.get(REWRITE_HEADER)).toBeNull()
  })

  it('falls through to HTML for bare Accept: */* (no explicit md preference)', () => {
    const req = makeRequest('/docs/guides/auth', { accept: '*/*' })
    expect(middleware(req).headers.get(REWRITE_HEADER)).toBeNull()
  })

  it('does not serve markdown when client explicitly rejects it (q=0)', () => {
    const req = makeRequest('/docs/guides/auth', {
      accept: 'text/markdown;q=0, text/html;q=1.0',
    })
    expect(middleware(req).headers.get(REWRITE_HEADER)).toBeNull()
  })

  it('tolerates OWS in q-params and clamps out-of-range q-values', () => {
    // OWS around q: html wins.
    const ows = makeRequest('/docs/guides/auth', {
      accept: 'text/html ; q = 1.0, text/markdown ; q = 0.5',
    })
    expect(middleware(ows).headers.get(REWRITE_HEADER)).toBeNull()
    // q=2.0 is out-of-range, falls back to default 1.0; tie -> markdown.
    const oor = makeRequest('/docs/guides/auth', {
      accept: 'text/html;q=2.0, text/markdown;q=1.0',
    })
    expect(middleware(oor).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
  })

  it('returns 406 with Cache-Control: no-store and Vary: Accept when Accept excludes every type', () => {
    const req = makeRequest('/docs/guides/auth', {
      accept: 'application/x-content-negotiation-probe',
    })
    const res = middleware(req)
    expect(res.status).toBe(406)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('Vary')).toBe('Accept')
  })

  it('does not 406 for LLM UAs or .md suffix paths even with a probe Accept', () => {
    const llm = makeRequest('/docs/guides/auth', {
      accept: 'application/x-content-negotiation-probe',
      userAgent: 'Claude-User/1.0',
    })
    expect(middleware(llm).status).not.toBe(406)
    expect(middleware(llm).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))

    const md = makeRequest('/docs/guides/auth.md', {
      accept: 'application/x-content-negotiation-probe',
    })
    expect(middleware(md).status).not.toBe(406)
    expect(middleware(md).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
  })

  it('does not 406 on /reference/* (negotiation contract is /guides/* only)', () => {
    const req = makeRequest('/docs/reference/javascript/introduction', {
      accept: 'application/x-content-negotiation-probe',
    })
    expect(middleware(req).status).not.toBe(406)
  })

  it('rewrites for each LLM user agent', () => {
    for (const ua of [
      'Claude-User (claude-code/2.1.119; +https://support.anthropic.com/)',
      'Claude-Web/1.0',
      'Mozilla/5.0 (compatible; ChatGPT-User/1.0)',
      'PerplexityBot/1.0',
    ]) {
      const req = makeRequest('/docs/guides/auth', { userAgent: ua })
      expect(middleware(req).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
    }
  })

  it('LLM UA overrides an Accept header that prefers HTML', () => {
    const req = makeRequest('/docs/guides/auth', {
      accept: 'text/html;q=1.0, text/markdown;q=0.1',
      userAgent: 'Claude-User/1.0',
    })
    expect(middleware(req).headers.get(REWRITE_HEADER)).toBe(GUIDES_MD_REWRITE('auth'))
  })

  it('falls through for non-LLM UAs (browsers, training crawlers, substring embeds)', () => {
    for (const ua of [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'GPTBot/1.0',
      'ClaudeBot/1.0',
      'CCBot/2.0',
      'chatgpt-userscript/2.0',
      'NotPerplexityBot',
    ]) {
      const req = makeRequest('/docs/guides/auth', { userAgent: ua })
      expect(middleware(req).headers.get(REWRITE_HEADER)).toBeNull()
    }
  })

  it('does not apply LLM UA rewrite to /reference/* (guides-only)', () => {
    const req = makeRequest('/docs/reference/javascript/introduction', {
      userAgent: 'Claude-User/1.0',
    })
    const rewrite = middleware(req).headers.get(REWRITE_HEADER) ?? ''
    expect(rewrite).not.toContain('/api/guides-md/')
  })
})
