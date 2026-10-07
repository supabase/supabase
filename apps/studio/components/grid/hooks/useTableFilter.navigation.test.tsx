import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { describe, expect, it, vi } from 'vitest'

import { useTableFilter, useUrlTableFilters } from './useTableFilter'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

vi.mock('next/router', () => import('@/compat/next/router'))

const tableA = '/project/default/editor/1?schema=public&filter=name%3Aeq%3ARed'
const tableB = '/project/default/editor/2?schema=public'

type RenderedState = { id?: string; urlFilters: unknown[]; tableFilters?: unknown[] }

function SidebarItemProbe({ renders }: { renders: RenderedState[] }) {
  // Same sources as the sidebar's active entity: route params (`query`, what `useParams` from
  // 'common' reads) for the id, the URL for filters.
  const id = useRouter().query.id?.toString()
  const { filters: urlFilters } = useTableFilter()
  const tableFilters = useUrlTableFilters(Number(id))
  renders.push({ id, urlFilters, tableFilters })
  return <output data-testid="table">{id}</output>
}

describe('useUrlTableFilters', () => {
  it("never returns another table's URL filters while navigation is pending", async () => {
    window.history.replaceState(null, '', tableA)
    const history = createBrowserHistory()
    const renders: RenderedState[] = []
    const root = createRootRoute({ component: Outlet })
    const table = createRoute({
      getParentRoute: () => root,
      path: '/project/$ref/editor/$id',
      // Keeps the old route params rendered after the location has already moved on.
      loader: () => new Promise((resolve) => setTimeout(resolve, 50)),
      component: () => <SidebarItemProbe renders={renders} />,
    })
    const router = createRouter({
      routeTree: root.addChildren([table]),
      history,
      parseSearch,
      stringifySearch,
      isServer: false,
    })
    await router.load()
    const view = render(<RouterProvider router={router} />)

    try {
      await act(async () => history.push(tableB))
      await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('2'))

      await act(async () => history.back())
      await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('1'))

      const table2Renders = renders.filter((state) => state.id === '2')
      // Table 2 was rendered with table 1's URL filters while Back was pending.
      expect(table2Renders.some((state) => state.urlFilters.length > 0)).toBe(true)
      for (const state of table2Renders) {
        expect(state.tableFilters ?? []).toEqual([])
      }
      expect(renders.at(-1)?.tableFilters).toHaveLength(1)
    } finally {
      view.unmount()
      history.destroy()
    }
  })
})
