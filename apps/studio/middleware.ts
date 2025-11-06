import { IS_PLATFORM } from 'lib/constants'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/api/:function*', '/org/:path*'],
}

// [Joshen] Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted:
const HOSTED_SUPPORTED_API_URLS = [
  '/ai/sql/generate-v4',
  '/ai/feedback/rate',
  '/ai/code/complete',
  '/ai/sql/cron-v2',
  '/ai/sql/title-v2',
  '/ai/onboarding/design',
  '/ai/feedback/classify',
  '/ai/docs',
  '/ai/table-quickstart/generate-schemas',
  '/get-ip-address',
  '/get-utc-time',
  '/get-deployment-commit',
  '/check-cname',
  '/edge-functions/test',
  '/edge-functions/body',
  '/generate-attachment-url',
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Handle API route blocking on platform
  if (pathname.startsWith('/api/')) {
    if (IS_PLATFORM && !HOSTED_SUPPORTED_API_URLS.some((url) => pathname.endsWith(url))) {
      return Response.json(
        { success: false, message: 'Endpoint not supported on hosted' },
        { status: 404 }
      )
    }
  }

  // Handle page blocking for local/self-hosted
  if (!IS_PLATFORM && pathname.startsWith('/org/')) {
    return Response.redirect(new URL('/404', request.url))
  }
}
