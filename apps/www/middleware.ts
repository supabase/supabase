import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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
