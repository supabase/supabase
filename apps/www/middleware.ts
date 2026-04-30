import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

import { MD_PAGES } from './app/api-v2/md/content.generated'

// Live-fetch LLM agents that retrieve pages on behalf of a user prompt.
// Training crawlers (GPTBot, CCBot, ClaudeBot, Anthropic-AI) are intentionally
// excluded; they are governed by robots.txt and serving them content that
// differs from the human HTML page would risk SEO and cloaking penalties.
const LLM_USER_AGENT = /\bClaude-User\b|\bClaude-Web\b|\bChatGPT-User\b|\bPerplexityBot\b/i

// Media ranges (RFC 9110 §5.3.2) ordered from most to least specific. Only
// the ranges below influence whether we serve markdown or HTML.
const RANGES = ['text/markdown', 'text/html', 'text/*', '*/*'] as const
type Range = (typeof RANGES)[number]

function isRange(s: string): s is Range {
  return (RANGES as readonly string[]).includes(s)
}

// Extract the q parameter (defaulting to 1) from a single Accept entry's
// parameter list. Tolerates OWS around `=` per RFC 9110, and clamps to
// [0, 1] per §12.4.2 — out-of-range values are ignored.
function parseQ(params: string[]): number {
  for (const p of params) {
    const [k, v] = p.split('=').map((s) => s.trim())
    if (k !== 'q') continue
    const q = parseFloat(v ?? '')
    if (Number.isFinite(q) && q >= 0 && q <= 1) return q
  }
  return 1
}

// Parse an Accept header into effective q-values for the two types we can
// produce. Specificity precedence (RFC 9110 §12.5.1) means a more-specific
// listed range wins over a broader wildcard, which preserves the difference
// between "absent" and "explicitly q=0" — critical for the 406 path.
//
// `markdownExplicit` lets the caller bias tie-breaks: a bare `Accept: */*`
// is "I don't care", not "give me markdown", so we only flip to markdown on
// a tie when the client actually named a text type.
function parseAccept(header: string) {
  const seen = new Map<Range, number>()

  for (const entry of header.toLowerCase().split(',')) {
    const [rawType, ...params] = entry.trim().split(';')
    const range = rawType.trim()
    if (!isRange(range)) continue
    seen.set(range, Math.max(seen.get(range) ?? -1, parseQ(params)))
  }

  return {
    html: seen.get('text/html') ?? seen.get('text/*') ?? seen.get('*/*') ?? 0,
    markdown: seen.get('text/markdown') ?? seen.get('text/*') ?? seen.get('*/*') ?? 0,
    markdownExplicit: seen.has('text/markdown') || seen.has('text/*'),
  }
}

function shouldServeMarkdown(accept: ReturnType<typeof parseAccept>): boolean {
  if (accept.markdown === 0) return false
  if (accept.markdown > accept.html) return true
  // Equal q-value: only switch on an explicit markdown / text/* preference.
  return accept.markdown === accept.html && accept.markdownExplicit
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
  const hasMdVariant = isMdEligible || isChangelogEntry

  // RFC 9110: when the client's Accept header excludes every type we can
  // produce, return 406. After specificity resolution, html === 0 and
  // markdown === 0 covers both "absent and uncovered by any wildcard" and
  // "explicitly rejected with q=0". Skip for LLM UAs (we always serve them
  // markdown) and for clients with no Accept header (browser default).
  if (
    hasMdVariant &&
    !isLlmAgent &&
    accept !== null &&
    accept.markdown === 0 &&
    accept.html === 0
  ) {
    // no-store guards against an edge cache pinning a probe response to the
    // URL; Vary: Accept makes intent explicit even though we don't cache.
    return new NextResponse('Not Acceptable', {
      status: 406,
      headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
    })
  }

  const wantsMarkdown = isLlmAgent || (accept !== null && shouldServeMarkdown(accept))

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
