import { IS_PLATFORM } from 'lib/constants'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: '/api/:function*',
}

// [Joshen] Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted:
const HOSTED_SUPPORTED_API_URLS = [
  '/ai/sql/suggest',
  '/ai/sql/generate-v2',
  '/ai/sql/generate-v3',
  '/ai/edge-function/complete',
  '/ai/onboarding/design',
  '/ai/sql/complete',
  '/ai/sql/title',
  '/ai/sql/debug',
  '/ai/sql/cron',
  '/ai/docs',
  '/get-ip-address',
  '/get-utc-time',
  '/edge-functions/test',
]

export function middleware(request: NextRequest) {
  if (IS_PLATFORM && !HOSTED_SUPPORTED_API_URLS.some((url) => request.url.endsWith(url))) {
    return Response.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }
}
