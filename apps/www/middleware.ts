import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

import { MD_PAGES } from './app/api-v2/md/content.generated'

// Live-fetch agents only. Training crawlers (GPTBot, ClaudeBot, CCBot) are
// governed by robots.txt; serving them content that differs from the HTML
// page risks SEO and cloaking penalties.
const LLM_USER_AGENT = /\bClaude-User\b|\bClaude-Web\b|\bChatGPT-User\b|\bPerplexityBot\b/i

// Media ranges (RFC 9110 §5.3.2) ordered most to least specific.
const RANGES = ['text/markdown', 'text/html', 'text/*', '*/*'] as const
type Range = (typeof RANGES)[number]

const Q_PARAM = /^\s*q\s*=\s*([\d.]+)\s*$/i

function isRange(s: string): s is Range {
  return (RANGES as readonly string[]).includes(s)
}

function parseQ(params: string[]): number {
  for (const p of params) {
    const q = parseFloat(p.match(Q_PARAM)?.[1] ?? '')
    if (Number.isFinite(q) && q >= 0 && q <= 1) return q
  }
  return 1
}

// `markdownExplicit` lets the caller avoid flipping a bare `Accept: */*` to
// markdown — generic clients sending */* aren't expressing a preference.
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
  return accept.markdown === accept.html && accept.markdownExplicit
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.endsWith('.md')) {
    const slug = pathname.slice(1, -3)
    if (MD_PAGES.has(slug)) {
      return NextResponse.rewrite(new URL(`/api-v2/md/${slug}`, request.nextUrl))
    }
  }

  const acceptHeader = request.headers.get('accept') ?? ''
  // Cap UA length before regex test to bound CPU on the edge hot path.
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 512)
  const isLlmAgent = LLM_USER_AGENT.test(userAgent)
  const accept = acceptHeader ? parseAccept(acceptHeader) : null

  // Strip trailing slash so /auth/ and /auth resolve to the same allowlist
  // entry — NextURL preserves trailing-slash style on rewrite targets.
  const slug = (pathname === '/' ? 'homepage' : pathname.slice(1)).replace(/\/$/, '')
  const isMdEligible = MD_PAGES.has(slug)
  const isChangelogEntry = slug === 'changelog' || /^changelog\/\d+/.test(slug)
  const hasMdVariant = isMdEligible || isChangelogEntry

  // 406 when Accept rejects every type we can produce. Skip for LLM UAs
  // (always served markdown) and clients with no Accept (browser default).
  if (
    hasMdVariant &&
    !isLlmAgent &&
    accept !== null &&
    accept.markdown === 0 &&
    accept.html === 0
  ) {
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
    // Changelog entries are static .md files in public/, not API routes.
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
    // MUST exclude _next/data to prevent full page reloads in multi-zone apps.
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|__nextjs).*)',
  ],
}
