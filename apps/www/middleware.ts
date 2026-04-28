import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

import { MD_PAGES } from './app/api-v2/md/content.generated'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle /<page>.md suffix: /pricing.md -> /api-v2/md/pricing
  if (pathname.endsWith('.md')) {
    const slug = pathname.slice(1, -3) // strip leading / and trailing .md
    if (MD_PAGES.has(slug)) {
      return NextResponse.rewrite(new URL(`/api-v2/md/${slug}`, request.nextUrl))
    }
  }

  // Content negotiation: Accept: text/markdown on known pages
  const accept = (request.headers.get('accept') ?? '').toLowerCase()
  if (accept.includes('text/markdown')) {
    // Strip trailing slash so /auth/ and /auth resolve to the same allowlist entry.
    // (NextURL's pathname setter preserves the trailing-slash style of the cloned
    // origin, which would otherwise leak through to the rewrite target.)
    const slug = (pathname === '/' ? 'homepage' : pathname.slice(1)).replace(/\/$/, '')
    if (MD_PAGES.has(slug)) {
      return NextResponse.rewrite(new URL(`/api-v2/md/${slug}`, request.nextUrl))
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
