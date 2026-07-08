import { createMiddleware, createStart } from '@tanstack/react-start'

import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import { isHostedSupportedApiPath } from '@/lib/hosted-api-allowlist'

// Self-hosted-only API routes must 404 in platform (hosted) mode. Under the
// Next pages router this lives in middleware (proxy.ts), but TanStack Start
// has no middleware runtime, so the guard is migrated here as a global
// request middleware sharing the same allowlist (lib/hosted-api-allowlist.ts).
// On Vercel our `/api/*` (and `/_serverFn/*`) requests are rewritten to the
// api/server.js function which runs the Start handler, so createStartHandler
// runs this server-side for every API request — even though pages are served
// as a static SPA shell. The guard therefore covers all API routes from a
// single place.

const platformApiGuard = createMiddleware({ type: 'request' }).server(({ request, next }) => {
  const { pathname } = new URL(request.url)
  // Path relative to the configured basePath — mirrors Next's basePath-
  // relative middleware matcher.
  const relativePath =
    BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname

  if (IS_PLATFORM && relativePath.startsWith('/api/') && !isHostedSupportedApiPath(relativePath)) {
    return Response.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }

  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [platformApiGuard],
}))
