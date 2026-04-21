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
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
