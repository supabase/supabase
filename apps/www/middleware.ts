import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

// Pages that have a .md equivalent in public/md/.
// Update this set when adding new .md files.
const MD_PAGES = new Set([
  'homepage',
  'pricing',
  'auth',
  'database',
  'edge-functions',
  'realtime',
  'storage',
  'vector',
  'modules/cron',
  'modules/queues',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle /<page>.md suffix: /pricing.md -> /api-v2/md/pricing
  if (pathname.endsWith('.md')) {
    const slug = pathname.slice(1, -3) // strip leading / and trailing .md
    if (MD_PAGES.has(slug)) {
      const url = request.nextUrl.clone()
      url.pathname = `/api-v2/md/${slug}`
      return NextResponse.rewrite(url)
    }
  }

  // Content negotiation: Accept: text/markdown on known pages
  const accept = request.headers.get('accept') ?? ''
  if (accept.includes('text/markdown')) {
    const slug = pathname.slice(1) // strip leading /
    if (MD_PAGES.has(slug)) {
      const url = request.nextUrl.clone()
      url.pathname = `/api-v2/md/${slug}`
      return NextResponse.rewrite(url)
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
