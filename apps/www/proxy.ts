import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { negotiateMarkdown } from 'common/markdown-negotiation'
import { NextResponse, type NextRequest } from 'next/server'

import { CHANGELOG_PAGES, MD_PAGES } from './app/api-v2/md/content.generated'

const OTHER_ZONE_PREFIXES = [
  '/docs',
  '/dashboard',
  '/library',
  '/design-system',
  '/kb',
  '/evals',
  '/migrate/instantdb',
  '/new-docs',
]

/**
 * www is a Next.js 16 zone, but the docs zone (served under /docs through a rewrite) and clients
 * holding a pre-upgrade bundle still run Next.js 15. Their client-side navigations into www pages
 * carry a `Next-Router-State-Tree` header in the v15 shape, where the fifth tuple element
 * (`isRootLayout`) is a boolean. v16 expects a number there, so it throws "The router state header
 * was sent but could not be parsed" and returns a 500.
 */
function hasLegacyRouterStateTree(request: NextRequest, pathname: string) {
  // Paths that lib/rewrites.js forwards to other zones. Those zones may legitimately run Next.js 15
  // (docs), so their own client navigations must reach them untouched.
  if (
    OTHER_ZONE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return false
  }

  const header = request.headers.get('next-router-state-tree')
  if (!header) return false

  try {
    const state = JSON.parse(decodeURIComponent(header))
    return Array.isArray(state) && typeof state[4] === 'boolean'
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The Next.js 15 router treats any non-RSC response as a cue to fall back to a full page load,
  // which is what happens today after the 500. Answer with a cheap 400 so it doesn't hit the renderer.
  if (hasLegacyRouterStateTree(request, pathname)) {
    return new NextResponse(null, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const isMarkdownSuffix = pathname.endsWith('.md')
  const basePathname = isMarkdownSuffix ? pathname.slice(0, -3) : pathname

  // Strip trailing slash so /auth/ and /auth resolve to the same allowlist
  // entry — NextURL preserves trailing-slash style on rewrite targets.
  const slug = (basePathname === '/' ? 'index' : basePathname.slice(1)).replace(/\/$/, '')
  const isMdEligible = MD_PAGES.has(slug)
  const isChangelogEntry = CHANGELOG_PAGES.has(slug)

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
