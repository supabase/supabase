import type { NextRequest } from 'next/server'

import { IS_PLATFORM } from '@/lib/constants'
import { isHostedSupportedApiPath } from '@/lib/hosted-api-allowlist'

export const config = {
  matcher: '/api/:function*',
}

// Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted.
// The allowlist is shared with the TanStack guard (start.ts) — see
// lib/hosted-api-allowlist.ts.
export function proxy(request: NextRequest) {
  if (IS_PLATFORM && !isHostedSupportedApiPath(request.nextUrl.pathname)) {
    return Response.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }
}
