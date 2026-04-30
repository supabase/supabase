import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

import { MD_PAGES } from './app/api-v2/md/content.generated'

// Live-fetch LLM agents that retrieve pages on behalf of a user prompt.
// Training crawlers (GPTBot, CCBot, ClaudeBot, Anthropic-AI) are intentionally
// excluded; they are governed by robots.txt and serving them content that
// differs from the human HTML page would risk SEO and cloaking penalties.
const LLM_USER_AGENT = /\bClaude-User\b|\bClaude-Web\b|\bChatGPT-User\b|\bPerplexityBot\b/i

// Parse an HTTP Accept header into the highest q-value seen for each type
// we can serve. Returns 0 for absent types. `text/*` contributes to both
// html and markdown; `*/*` is tracked separately so we can detect "client
// will accept anything" without it overriding an explicit type preference.
function parseAccept(header: string) {
  let html = 0
  let markdown = 0
  let any = 0
  for (const part of header.toLowerCase().split(',')) {
    const [type, ...params] = part.trim().split(';')
    let q = 1
    for (const p of params) {
      // Tolerate whitespace around `=` per RFC 9110 OWS rules: `q = 0.5`.
      const [k, v] = p.split('=').map((s) => s.trim())
      if (k === 'q') {
        const parsed = parseFloat(v ?? '')
        // Clamp to [0, 1] per RFC 9110 §12.4.2; out-of-range values are
        // ignored rather than skewing the comparison.
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) q = parsed
      }
    }
    const t = type.trim()
    if (t === 'text/markdown' || t === 'text/*') markdown = Math.max(markdown, q)
    if (t === 'text/html' || t === 'text/*') html = Math.max(html, q)
    if (t === '*/*') any = Math.max(any, q)
  }
  return { html, markdown, any }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle /<page>.md suffix: /pricing.md -> /api-v2/md/pricing
  if (pathname.endsWith('.md')) {
    const slug = pathname.slice(1, -3) // strip leading / and trailing .md
    if (MD_PAGES.has(slug)) {
      return NextResponse.rewrite(new URL(`/api-v2/md/${slug}`, request.nextUrl))
    }
  }

  // Cache-key safety: rewriting to /api-v2/md/<slug> partitions the response
  // by path, so no Vary: User-Agent is needed.
  const acceptHeader = request.headers.get('accept') ?? ''
  // Cap UA length before regex test to bound CPU on the edge hot path.
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 512)
  const isLlmAgent = LLM_USER_AGENT.test(userAgent)
  const accept = acceptHeader ? parseAccept(acceptHeader) : null

  // Strip trailing slash so /auth/ and /auth resolve to the same allowlist entry.
  // (NextURL's pathname setter preserves the trailing-slash style of the cloned
  // origin, which would otherwise leak through to the rewrite target.)
  const slug = (pathname === '/' ? 'homepage' : pathname.slice(1)).replace(/\/$/, '')
  const isMdEligible = MD_PAGES.has(slug)
  const isChangelogEntry = slug === 'changelog' || /^changelog\/\d+/.test(slug)

  // RFC 9110: when the client's Accept header excludes every type we can
  // produce, return 406. Applies to any path that has a markdown variant
  // (MD_PAGES allowlist or numeric changelog entries). Skip for LLM UAs
  // (we always serve them markdown) and for clients with no Accept header
  // (browser default fallback).
  if (
    (isMdEligible || isChangelogEntry) &&
    !isLlmAgent &&
    accept !== null &&
    accept.markdown === 0 &&
    accept.html === 0 &&
    accept.any === 0
  ) {
    // no-store guards against an edge cache pinning a probe response to the
    // URL; Vary: Accept makes intent explicit even though we don't cache.
    return new NextResponse('Not Acceptable', {
      status: 406,
      headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
    })
  }

  // Serve markdown when the client either matches an LLM UA or expresses a
  // preference for text/markdown over text/html via q-values. Equal q ties
  // resolve to markdown since the client explicitly listed it as an option.
  const wantsMarkdown =
    isLlmAgent || (accept !== null && accept.markdown > 0 && accept.markdown >= accept.html)

  if (wantsMarkdown) {
    if (isMdEligible) {
      return NextResponse.rewrite(new URL(`/api-v2/md/${slug}`, request.nextUrl))
    }
    // Individual changelog entries are served as static .md files from public/;
    // rewrite directly to the static path. The slug always starts with the number.
    if (isChangelogEntry) {
      return NextResponse.rewrite(new URL(`/${slug}.md`, request.nextUrl))
    }
  }

  const response = NextResponse.next()
  stampFirstReferrerCookie(request, response)
  return response
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files.
    // MUST exclude _next/data to prevent full page reloads in multi-zone apps.
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|__nextjs).*)',
  ],
}
