import {
  FIRST_REFERRER_COOKIE_NAME,
  shouldRefreshCookie,
  stampFirstReferrerCookie,
} from 'common/first-referrer-cookie'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { IS_PLATFORM } from '@/lib/constants'

// [Joshen] Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted:
const HOSTED_SUPPORTED_API_URLS = [
  '/ai/sql/generate-v4',
  '/ai/sql/policy',
  '/ai/feedback/rate',
  '/ai/code/complete',
  '/ai/sql/cron-v2',
  '/ai/sql/title-v2',
  '/ai/sql/filter-v1',
  '/ai/onboarding/design',
  '/ai/feedback/classify',
  '/ai/docs',
  '/get-ip-address',
  '/get-utc-time',
  '/get-deployment-commit',
  '/check-cname',
  '/edge-functions/test',
  '/edge-functions/body',
  '/generate-attachment-url',
  '/incident-status',
  '/api/integrations/stripe-sync',
]

export function proxy(request: NextRequest) {
  // API route filtering for hosted platform
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (
      IS_PLATFORM &&
      !HOSTED_SUPPORTED_API_URLS.some((url) => request.nextUrl.pathname.endsWith(url))
    ) {
      return Response.json(
        { success: false, message: 'Endpoint not supported on hosted' },
        { status: 404 }
      )
    }
    // Valid API route — pass through without middleware interference
    return
  }

  // Belt & suspenders: stamp first-referrer cookie for direct Studio visits.
  // Primary stamping happens in www/docs middleware; this catches edge cases
  // like bookmarked Studio URLs with UTMs or direct-to-Studio paid traffic.
  //
  // IMPORTANT: Only return NextResponse.next() when we actually need to set a
  // cookie. In the multi-zone production setup (www proxies /dashboard/* → Studio),
  // returning an explicit NextResponse.next() unconditionally causes the response
  // to flow through Next.js's middleware response pipeline, which interferes with
  // client-side navigation and triggers full page reloads. Returning undefined
  // lets Next.js handle the request completely untouched.
  const referrer = request.headers.get('referer') ?? ''
  const { stamp } = shouldRefreshCookie(request.cookies.has(FIRST_REFERRER_COOKIE_NAME), {
    referrer,
    url: request.url,
  })

  if (stamp) {
    const response = NextResponse.next()
    stampFirstReferrerCookie(request, response)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|_next/data|favicon.ico|__nextjs).*)'],
}
