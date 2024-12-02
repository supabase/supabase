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
  '/ai/sql/title',
  '/ai/sql/debug',
  '/ai/sql/cron',
  '/get-ip-address',
]

export function middleware(request: NextRequest) {
  const url = request.url
  if (IS_PLATFORM && !HOSTED_SUPPORTED_API_URLS.some((url) => request.url.endsWith(url))) {
    return Response.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }
}
