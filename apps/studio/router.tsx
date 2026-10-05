import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { initSentryTanStackClient } from './sentry.tanstack'
import { getQueryClient } from '@/data/query-client'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

export interface RouterContext {
  queryClient: QueryClient
}

function getContext(): RouterContext {
  return {
    queryClient: getQueryClient(),
  }
}

export function getRouter() {
  const context = getContext()

  const router = createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Next-style search params (plain strings, repeated keys → arrays)
    // instead of TanStack's JSON defaults, which coerce "2"→2/"true"→true
    // and JSON-quote strings on write. The whole app — including the
    // next/router compat shim and nuqs — expects the Next semantics.
    parseSearch,
    stringifySearch,
    // Inlined via Vite's `define` at build time; stays undefined (= app at `/`)
    // unless NEXT_PUBLIC_BASE_PATH is set. Must agree with Vite `base`
    basepath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  })

  // Sentry: nothing loads Next's convention files (instrumentation-client.ts)
  // under TanStack Start, so init happens here — the earliest point with
  // access to the router instance, which the tracing integration needs.
  // No-op on the server and when no DSN is configured (see module).
  initSentryTanStackClient(router)

  // @tanstack/react-router-ssr-query@1.166.12 pulls in @tanstack/query-core@5.100
  // as a peer, but our app pins react-query to 5.83. The QueryClient class is
  // structurally identical between the two, but TS treats them as nominally
  // distinct types because each version has its own `#private` field.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient as any })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
