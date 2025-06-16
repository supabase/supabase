import { IS_PLATFORM } from 'lib/constants'
import { getCSP } from 'lib/csp'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const config = {
  matcher: ['/api/:function*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}

// [Joshen] Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted:
const HOSTED_SUPPORTED_API_URLS = [
  '/ai/sql/generate-v3',
  '/ai/edge-function/complete',
  '/ai/onboarding/design',
  '/ai/sql/complete',
  '/ai/sql/title',
  '/ai/sql/cron',
  '/ai/feedback/classify',
  '/get-ip-address',
  '/get-utc-time',
  '/edge-functions/test',
  '/edge-functions/body',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // In middleware, you can access the basePath from the config
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const apiPath = `${basePath}/api/`

  // Handle API endpoint restrictions for hosted platform (only for API routes)
  if (
    pathname.startsWith(apiPath) &&
    IS_PLATFORM &&
    !HOSTED_SUPPORTED_API_URLS.some((url) => request.url.endsWith(url))
  ) {
    return NextResponse.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }

  const response = NextResponse.next()

  if (process.env.NEXT_PUBLIC_IS_PLATFORM === 'true') {
    const csp = getCSP()

    response.headers.set('Content-Security-Policy', csp)
  } else {
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none';")
  }

  return response
}
