import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  type AnyRoute,
} from '@tanstack/react-router'
import { act, render, type RenderOptions } from '@testing-library/react'

import { CustomWrapper } from './custom-render'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

type RouteNode = { id: string } | { path: string }

type RenderRouteOptions = Omit<Parameters<typeof CustomWrapper>[0], 'children'> & {
  routeId: string
  url: string
  renderOptions?: RenderOptions
}

// `/_app/org/$slug/general` → [{ id: '_app' }, { path: 'org/$slug/general' }]
// `/project/$ref/` → [{ path: 'project/$ref' }, { path: '/' }]
function toRouteNodes(routeId: string): RouteNode[] {
  const segments = routeId.split('/').slice(1)
  const isIndexRoute = routeId.endsWith('/')
  const { nodes, pending } = segments.reduce<{ nodes: RouteNode[]; pending: string[] }>(
    (acc, segment) => {
      if (!segment) return acc
      const isPathless = segment.startsWith('_') && segment.length > 1
      if (!isPathless) return { ...acc, pending: [...acc.pending, segment] }
      const pathNodes = acc.pending.length ? [{ path: acc.pending.join('/') }] : []
      return { nodes: [...acc.nodes, ...pathNodes, { id: segment }], pending: [] }
    },
    { nodes: [], pending: [] }
  )
  const pathNodes = pending.length ? [{ path: pending.join('/') }] : []
  return [...nodes, ...pathNodes, ...(isIndexRoute ? [{ path: '/' }] : [])]
}

// Mounts the real file route under a bare root, rebuilding its id chain the way
// routeTree.gen.ts does, so `Route.useParams()` and friends resolve without
// loading the app's real layouts.
function buildRouteTree(route: AnyRoute, routeId: string) {
  const rootRoute = createRootRoute()
  const nodes = toRouteNodes(routeId)
  const parents = nodes.slice(0, -1).reduce<AnyRoute[]>((acc, node) => {
    const parent = acc.at(-1) ?? rootRoute
    return [...acc, createRoute({ getParentRoute: () => parent, ...node })]
  }, [])
  const leafParent = parents.at(-1) ?? rootRoute
  Object.assign(route.options, { getParentRoute: () => leafParent, ...nodes.at(-1) })
  ;[...parents, route].reduceRight<AnyRoute | undefined>((child, parent) => {
    if (child) parent.addChildren([child])
    return parent
  }, undefined)
  return rootRoute.addChildren([parents[0] ?? route])
}

/**
 * Renders a file route at `url` inside a memory router, wrapped in the same providers as
 * `customRender`. `routeId` is the id passed to `createFileRoute`. Returns the router so
 * tests can assert on navigation.
 */
export async function renderRoute(
  route: AnyRoute,
  { routeId, url, renderOptions, ...wrapper }: RenderRouteOptions
) {
  const router = createRouter({
    routeTree: buildRouteTree(route, routeId),
    history: createMemoryHistory({ initialEntries: [url] }),
    parseSearch,
    stringifySearch,
    defaultNotFoundComponent: () => null,
  })
  await act(() => router.load())
  const result = render(<RouterProvider router={router} />, {
    wrapper: ({ children }) => <CustomWrapper {...wrapper}>{children}</CustomWrapper>,
    ...renderOptions,
  })
  return { ...result, router }
}
