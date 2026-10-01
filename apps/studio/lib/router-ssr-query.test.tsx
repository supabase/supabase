import { QueryClient, useSuspenseQuery } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { attachRouterServerSsrUtils } from '@tanstack/react-router/ssr/server'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

const queryOptions = {
  queryKey: ['router-ssr-regression'],
  queryFn: async () => 'server query result',
  staleTime: Infinity,
}

function QueryPage() {
  const { data } = useSuspenseQuery(queryOptions)
  return <div>{data}</div>
}

function createFixture(isServer: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    component: Outlet,
  })
  const page = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    loader: ({ context }) => context.queryClient.ensureQueryData(queryOptions),
    component: QueryPage,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: { queryClient },
    isServer,
  })
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })
  if (isServer) attachRouterServerSsrUtils({ router, manifest: undefined })
  return { router, queryClient }
}

describe('router SSR query integration', () => {
  it('loads and renders cached queries through SSR dehydration, then releases request state', async () => {
    const server = createFixture(true)
    try {
      await server.router.load()
      expect(server.router.state.matches.every((match) => match.status === 'success')).toBe(true)
      const dehydrate = server.router.options.dehydrate!
      let dehydrated: Awaited<ReturnType<typeof dehydrate>> | undefined
      server.router.options.dehydrate = async () => {
        dehydrated = await dehydrate()
        return dehydrated
      }
      await server.router.serverSsr?.dehydrate()
      if (!dehydrated) throw new Error('Router did not dehydrate the query cache')
      expect(dehydrated).toMatchObject({
        query: { initial: [{ state: { data: 'server query result', status: 'success' } }] },
      })
      expect(renderToString(<RouterProvider router={server.router} />)).toContain(
        'server query result'
      )
    } finally {
      server.router.serverSsr?.cleanup()
    }
    expect(server.queryClient.getQueryCache().getAll()).toEqual([])
  })

  it('hydrates initial and streamed queries, then releases their request cache', async () => {
    const server = createFixture(true)
    const client = createFixture(false)
    const pending = Promise.withResolvers<string>()
    try {
      await server.router.load()
      const dehydrated = await server.router.options.dehydrate?.()
      if (!dehydrated) throw new Error('Router did not dehydrate the query cache')
      await client.router.options.hydrate?.(dehydrated)
      expect(client.queryClient.getQueryData(queryOptions.queryKey)).toBe('server query result')
      const request = server.queryClient.fetchQuery({
        queryKey: ['late-query'],
        queryFn: () => pending.promise,
      })
      pending.resolve('streamed query result')
      await request
      await expect
        .poll(() => client.queryClient.getQueryData(['late-query']))
        .toBe('streamed query result')
    } finally {
      server.router.serverSsr?.cleanup()
      client.queryClient.clear()
    }
    expect(server.queryClient.getQueryCache().getAll()).toEqual([])
  })
})
