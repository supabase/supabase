import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react'
import { createMiddleware, createStart } from '@tanstack/react-start'

import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import { isHostedSupportedApiPath } from '@/lib/hosted-api-allowlist'

// Self-hosted-only API routes must 404 in platform (hosted) mode. Under the
// Next pages router this lives in middleware (proxy.ts); TanStack Start has no
// middleware runtime, so it's a global request middleware sharing the same
// allowlist (lib/hosted-api-allowlist.ts). On Vercel every `/api/*` request
// still reaches the function (pages are a static shell), so this covers all
// API routes from one place.

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

// Sentry's global middlewares go at the FRONT so they wrap the whole request /
// server-function lifecycle — including errors that downstream code swallows
// into a 500, which the manual `@sentry/nextjs` approach never sees. The SDK's
// Vite plugin can auto-wrap these arrays instead, but we disable that
// (`autoInstrumentMiddleware: false` in vite.config.ts) and wire them
// explicitly so the instrumentation is visible in source.
export const startInstance = createStart(() => ({
  requestMiddleware: [sentryGlobalRequestMiddleware, platformApiGuard],
  functionMiddleware: [sentryGlobalFunctionMiddleware],
}))
