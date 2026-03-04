import {
  FIRST_REFERRER_COOKIE_NAME,
  MW_DIAG_COOKIE_NAME,
  shouldRefreshCookie,
  stampFirstReferrerCookie,
} from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const pathname = request.nextUrl.pathname
  const isDashboardOrDocs = pathname.startsWith('/dashboard') || pathname.startsWith('/docs')

  if (isDashboardOrDocs) {
    // Phase 1: diagnostic only — no permanent cookie mutations.
    // Compute what Phase 2 would do and encode it in a short-lived cookie
    // readable by client-side telemetry so we get PostHog-visible data.
    // This also tests the Set-Cookie mutation path that Phase 2 will use.
    const referrer = request.headers.get('referer') ?? ''
    const hasCookie = request.cookies.has(FIRST_REFERRER_COOKIE_NAME)
    const { stamp: wouldStamp } = shouldRefreshCookie(hasCookie, { referrer, url: request.url })

    response.cookies.set(
      MW_DIAG_COOKIE_NAME,
      `hit=1&would_stamp=${wouldStamp ? '1' : '0'}&has_cookie=${hasCookie ? '1' : '0'}`,
      { path: '/', sameSite: 'lax', maxAge: 60 }
    )
    return response
  }

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
