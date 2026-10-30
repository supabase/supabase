import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTableEditorFiltersSort } from '../useTableEditorFiltersSort'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

vi.mock('next/router', () => import('@/compat/next/router'))

type SetParams = ReturnType<typeof useTableEditorFiltersSort>['setParams']
const hooks: { sort?: SetParams; filter?: SetParams } = {}

// Separate instances, like useTableSort and useSyncFiltersToUrl in the grid.
function SortProbe() {
  hooks.sort = useTableEditorFiltersSort().setParams
  return null
}
function FilterProbe() {
  hooks.filter = useTableEditorFiltersSort().setParams
  return null
}

async function renderAt(url: string) {
  window.history.replaceState(null, '', url)
  const history = createBrowserHistory()
  const root = createRootRoute({ component: Outlet })
  const route = createRoute({
    getParentRoute: () => root,
    path: '/project/$ref/editor/$id',
    component: () => (
      <>
        <SortProbe />
        <FilterProbe />
      </>
    ),
  })
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history,
    parseSearch,
    stringifySearch,
    isServer: false,
  })
  await router.load()
  const view = render(<RouterProvider router={router} />)
  return () => {
    view.unmount()
    history.destroy()
  }
}

const getParams = () => new URLSearchParams(window.location.search)

describe('useTableEditorFiltersSort setParams with overlapping pushes (TanStack)', () => {
  it.each([
    ['sort then filter', ['sort', 'filter'] as const],
    ['filter then sort', ['filter', 'sort'] as const],
  ])('keeps both params when pushed %s before the router updates', async (_, order) => {
    const cleanup = await renderAt('/project/default/editor/1?schema=public&filter=name:eq:Red')
    try {
      act(() => {
        for (const key of order) {
          if (key === 'sort') hooks.sort?.((prev) => ({ ...prev, sort: ['id:desc'] }))
          else hooks.filter?.((prev) => ({ ...prev, filter: ['name:eq:Green'] }))
        }
      })
      await waitFor(() => {
        expect(getParams().getAll('filter')).toEqual(['name:eq:Green'])
        expect(getParams().getAll('sort')).toEqual(['id:desc'])
      })
      expect(window.location.pathname).toBe('/project/default/editor/1')
      expect(getParams().get('schema')).toBe('public')
    } finally {
      cleanup()
    }
  })
})
