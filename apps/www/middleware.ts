import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { negotiateMarkdown } from 'common/markdown-negotiation'
import { NextResponse, type NextRequest } from 'next/server'

import { MD_PAGES } from './app/api-v2/md/content.generated'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isMarkdownSuffix = pathname.endsWith('.md')
  const basePathname = isMarkdownSuffix ? pathname.slice(0, -3) : pathname

  // Strip trailing slash so /auth/ and /auth resolve to the same allowlist
  // entry — NextURL preserves trailing-slash style on rewrite targets.
  const slug = (basePathname === '/' ? 'homepage' : basePathname.slice(1)).replace(/\/$/, '')
  const isMdEligible = MD_PAGES.has(slug)
  const isChangelogEntry = slug === 'changelog' || /^changelog\/\d+/.test(slug)

  const decision = negotiateMarkdown(
    { acceptHeader: request.headers.get('accept') ?? '' },
    { hasMarkdownVariant: isMdEligible || isChangelogEntry, isMarkdownSuffix }
  )

  if (decision === 'not-acceptable') {
    return new NextResponse('Not Acceptable', {
      status: 406,
      headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
    })
  }

  if (decision === 'markdown') {
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
