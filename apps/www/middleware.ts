import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  stampFirstReferrerCookie(request, response)
  return response
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and proxied app paths.
    // - _next/data: client-side navigation JSON fetches (MUST exclude to prevent full page reloads)
    // - dashboard: Studio app (proxied via multi-zone, has its own cookie stamping in proxy.ts)
    // - docs: Docs app (proxied via multi-zone in prod, has its own middleware for cookie stamping)
    '/((?!api|_next/static|_next/image|_next/data|dashboard|docs|favicon.ico|__nextjs).*)',
  ],
}
