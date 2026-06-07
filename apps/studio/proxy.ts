import type { NextRequest } from 'next/server'

import { IS_PLATFORM } from '@/lib/constants'

export const config = {
  matcher: '/api/:function*',
}

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
  '/ai/sql/parse-client-code',
  '/get-ip-address',
  '/get-utc-time',
  '/get-deployment-commit',
  '/check-cname',
  '/edge-functions/test',
  '/edge-functions/body',
  '/generate-attachment-url',
  '/incident-status',
  '/incident-banner',
  '/status-override',
  '/api/integrations/stripe-sync',
  '/content/graphql',
  '/parse-query',
]

// [console fork] Paths we own in platform mode: better-auth (proxied to our
// control-plane via next.config rewrites) and the BFF that translates studio's
// /platform/* calls to our /api/v1. These must bypass the hosted 404 guard.
const CONSOLE_FORK_PREFIXES = ['/api/auth/', '/api/platform/', '/api/v1/']

export function proxy(request: NextRequest) {
  if (CONSOLE_FORK_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    return
  }

  if (
    IS_PLATFORM &&
    !HOSTED_SUPPORTED_API_URLS.some((url) => request.nextUrl.pathname.endsWith(url))
  ) {
    return Response.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }
}
