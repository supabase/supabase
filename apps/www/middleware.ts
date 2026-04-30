import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

import { MD_PAGES } from './app/api-v2/md/content.generated'

// Live-fetch LLM agents that retrieve pages on behalf of a user prompt.
// Training crawlers (GPTBot, CCBot, ClaudeBot, Anthropic-AI) are intentionally
// excluded; they are governed by robots.txt and serving them content that
// differs from the human HTML page would risk SEO and cloaking penalties.
const LLM_USER_AGENT = /\bClaude-User\b|\bClaude-Web\b|\bChatGPT-User\b|\bPerplexityBot\b/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle /<page>.md suffix: /pricing.md -> /api-v2/md/pricing
  if (pathname.endsWith('.md')) {
    const slug = pathname.slice(1, -3) // strip leading / and trailing .md
    if (MD_PAGES.has(slug)) {
      return NextResponse.rewrite(new URL(`/api-v2/md/${slug}`, request.nextUrl))
    }
  }

  // Serve markdown to known LLM clients (Accept header or UA match).
  // Cache-key safety: rewriting to /api-v2/md/<slug> partitions the response
  // by path, so no Vary: User-Agent is needed.
  const accept = (request.headers.get('accept') ?? '').toLowerCase()
  // Cap UA length before regex test to bound CPU on the edge hot path.
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 512)
  if (accept.includes('text/markdown') || LLM_USER_AGENT.test(userAgent)) {
    // Strip trailing slash so /auth/ and /auth resolve to the same allowlist entry.
    // (NextURL's pathname setter preserves the trailing-slash style of the cloned
    // origin, which would otherwise leak through to the rewrite target.)
    const slug = (pathname === '/' ? 'homepage' : pathname.slice(1)).replace(/\/$/, '')
    if (MD_PAGES.has(slug)) {
      return NextResponse.rewrite(new URL(`/api-v2/md/${slug}`, request.nextUrl))
    }
    // Individual changelog entries are served as static .md files from public/;
    // rewrite directly to the static path. The slug always starts with the number.
    if (slug === 'changelog' || /^changelog\/\d+/.test(slug)) {
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
