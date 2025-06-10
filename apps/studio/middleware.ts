import { IS_PLATFORM } from 'lib/constants'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: '/api/:function*',
}

// [Joshen] Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted:
const HOSTED_SUPPORTED_API_URLS = [
  '/ai/sql/generate-v3',
  '/ai/edge-function/complete',
  '/ai/onboarding/design',
  '/ai/sql/complete',
  '/ai/sql/title',
  '/ai/sql/cron',
  '/get-ip-address',
  '/get-utc-time',
  '/edge-functions/test',
  '/edge-functions/body',
]

export function middleware(request: NextRequest) {
  // Use pathname for matching, ignore query parameters
  const pathname = request.nextUrl.pathname

  if (IS_PLATFORM && !HOSTED_SUPPORTED_API_URLS.includes(pathname)) {
    // Return a NextResponse for API routes
    return NextResponse.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }

  // Allow the request to proceed if it matches or if not IS_PLATFORM
  return NextResponse.next()
}
