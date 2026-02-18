import { NextResponse, type NextRequest } from 'next/server'
import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_MAX_AGE,
  FIRST_REFERRER_COOKIE_NAME,
  serializeFirstReferrerCookie,
  shouldRefreshCookie,
} from 'common/first-referrer-cookie'

export function middleware(request: NextRequest) {
  const referrer = request.headers.get('referer') ?? ''

  const { stamp } = shouldRefreshCookie(request.cookies.has(FIRST_REFERRER_COOKIE_NAME), {
    referrer,
    url: request.url,
  })

  if (!stamp) return NextResponse.next()

  const data = buildFirstReferrerData({
    referrer,
    landingUrl: request.url,
  })

  const response = NextResponse.next()

  response.cookies.set(
    FIRST_REFERRER_COOKIE_NAME,
    serializeFirstReferrerCookie(data),
    {
      path: '/',
      sameSite: 'lax',
      ...(request.nextUrl.hostname === 'supabase.com' ||
      request.nextUrl.hostname.endsWith('.supabase.com')
        ? { domain: 'supabase.com', secure: true }
        : {}),
      maxAge: FIRST_REFERRER_COOKIE_MAX_AGE,
    }
  )

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|__nextjs).*)',
  ],
}
