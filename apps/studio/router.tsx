import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { getQueryClient } from '@/data/query-client'

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
    // Inlined via Vite's `define` at build time; stays undefined (= app at `/`)
    // unless NEXT_PUBLIC_BASE_PATH is set. Must agree with Vite `base` and
    // Nitro `baseURL` — see vite.config.ts.
    basepath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
