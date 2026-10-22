import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useRouter } from './router'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

describe('Next router compatibility subscriptions', () => {
  it('keeps router-dependent effects stable while route loaders refresh', async () => {
    const onRouterChange = vi.fn()
    const refreshed = Promise.withResolvers<string>()
    let loadCount = 0

    function Page() {
      const router = useRouter()
      useEffect(() => onRouterChange(router), [router])
      return <div>{router.asPath}</div>
    }

    const rootRoute = createRootRoute({ component: Outlet })
    const page = createRoute({
      getParentRoute: () => rootRoute,
      path: '/project/$ref/editor',
      component: Page,
      loader: () => (++loadCount === 1 ? 'initial' : refreshed.promise),
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([page]),
      history: createMemoryHistory({ initialEntries: ['/project/default/editor?schema=public'] }),
      parseSearch,
      stringifySearch,
      isServer: false,
    })
    await router.load()
    const view = render(<RouterProvider router={router} />)
    expect(onRouterChange).toHaveBeenCalledTimes(1)

    try {
      let refresh: Promise<void> | undefined
      await act(async () => {
        refresh = router.invalidate({ sync: true })
      })
      await waitFor(() => expect(loadCount).toBe(2))
      expect(screen.getByText('/project/default/editor?schema=public')).toBeInTheDocument()
      expect(onRouterChange).toHaveBeenCalledTimes(1)

      await act(async () => {
        refreshed.resolve('refreshed')
        await refresh
      })
      expect(onRouterChange).toHaveBeenCalledTimes(1)
    } finally {
      refreshed.resolve('refreshed')
      view.unmount()
    }
  })

  it('updates route pattern, params, query and hash after pending navigation', async () => {
    const loaded = Promise.withResolvers<void>()

    function Layout() {
      const router = useRouter()
      return (
        <>
          <div data-testid="location">{router.asPath}</div>
          <div data-testid="pattern">{router.pathname}</div>
          <div data-testid="query">{JSON.stringify(router.query)}</div>
          <Outlet />
        </>
      )
    }

    const rootRoute = createRootRoute({ component: Layout })
    const initial = createRoute({ getParentRoute: () => rootRoute, path: '/project/$ref/editor' })
    const target = createRoute({
      getParentRoute: () => rootRoute,
      path: '/project/$ref/editor/$id',
      loader: () => loaded.promise,
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([initial, target]),
      history: createMemoryHistory({ initialEntries: ['/project/default/editor?schema=public'] }),
      parseSearch,
      stringifySearch,
      isServer: false,
    })
    await router.load()
    const view = render(<RouterProvider router={router} />)

    try {
      let navigation: Promise<void> | undefined
      await act(async () => {
        navigation = router.navigate({
          to: '/project/$ref/editor/$id',
          params: { ref: 'other', id: '42' },
          search: { schema: 'private' },
          hash: 'selection',
        })
      })
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/project/other/editor/42?schema=private#selection'
      )

      await act(async () => {
        loaded.resolve()
        await navigation
      })
      expect(screen.getByTestId('pattern')).toHaveTextContent('/project/[ref]/editor/[id]')
      expect(JSON.parse(screen.getByTestId('query').textContent ?? '')).toEqual({
        ref: 'other',
        id: '42',
        schema: 'private',
      })
    } finally {
      loaded.resolve()
      view.unmount()
    }
  })
})
