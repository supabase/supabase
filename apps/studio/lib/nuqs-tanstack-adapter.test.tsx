import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useQueryState } from 'nuqs'
import { describe, expect, it } from 'vitest'

import { NuqsAdapter } from './nuqs-tanstack-adapter'
import { parseSearch, stringifySearch } from './router-search-params'

describe('NuqsAdapter (TanStack Router)', () => {
  it('does not re-render a useQueryState consumer when an unwatched search param changes', async () => {
    let renderCount = 0

    function WatchedProbe() {
      renderCount++
      const [watched] = useQueryState('watched')
      return <span data-testid="watched">{watched ?? 'empty'}</span>
    }

    const rootRoute = createRootRoute({
      component: () => (
        <NuqsAdapter>
          <Outlet />
        </NuqsAdapter>
      ),
    })
    const pageRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/items',
      component: WatchedProbe,
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([pageRoute]),
      history: createMemoryHistory({ initialEntries: ['/items?watched=a&other=1'] }),
      parseSearch,
      stringifySearch,
    })

    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('watched')).toHaveTextContent('a')

    const rendersAfterMount = renderCount

    await act(async () => {
      await router.navigate({
        to: '/items',
        search: { watched: 'a', other: '2' },
      })
    })
    expect(renderCount).toBe(rendersAfterMount)

    await act(async () => {
      await router.navigate({
        to: '/items',
        search: { watched: 'b', other: '2' },
      })
    })
    await waitFor(() => expect(screen.getByTestId('watched')).toHaveTextContent('b'))
  })
})
