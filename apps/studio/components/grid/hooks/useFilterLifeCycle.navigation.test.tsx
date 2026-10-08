import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useInitializeFiltersFromUrl, useSyncFiltersToUrl } from './useFilterLifeCycle'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { ForeignTable } from '@/data/table-editor/table-editor-types'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import {
  TableEditorTableStateContextProvider,
  useTableEditorTableStateSnapshot,
} from '@/state/table-editor-table'

vi.mock('next/router', () => import('@/compat/next/router'))

const unfiltered = '/project/default/editor/1?schema=public'

// The hooks only read `id`; a foreign table is the smallest complete `Entity`.
const table: ForeignTable = {
  entity_type: ENTITY_TYPE.FOREIGN_TABLE,
  id: 1,
  // Empty schema skips the index advisor provider and its project queries.
  schema: '',
  name: 'colors',
  comment: null,
  foreign_server_name: '',
  foreign_data_wrapper_name: '',
  foreign_data_wrapper_handler: '',
  columns: [],
}

let snap: ReturnType<typeof useTableEditorTableStateSnapshot>

function FiltersProbe() {
  snap = useTableEditorTableStateSnapshot()
  useInitializeFiltersFromUrl()
  useSyncFiltersToUrl()
  return <output data-testid="filters">{snap.filters.map((f) => f.value).join(',')}</output>
}

const getHistoryIndex = () => (window.history.state as { __TSR_index?: number }).__TSR_index

async function renderTableAt(url: string) {
  window.history.replaceState(null, '', url)
  const history = createBrowserHistory()
  const root = createRootRoute({ component: Outlet })
  const route = createRoute({
    getParentRoute: () => root,
    path: '/project/$ref/editor/$id',
    component: () => (
      <TableEditorTableStateContextProvider projectRef="default" table={table}>
        <FiltersProbe />
      </TableEditorTableStateContextProvider>
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
  return {
    history,
    cleanup: () => {
      view.unmount()
      history.destroy()
    },
  }
}

// Outlasts the 500ms state → URL debounce, so any sync push would have landed.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 700)))

describe('useSyncFiltersToUrl', () => {
  it('follows Back/Forward between entries of the same table without adding entries', async () => {
    const { history, cleanup } = await renderTableAt(unfiltered)

    try {
      await act(async () => snap.setFilters([{ column: 'name', operator: '=', value: 'Red' }]))
      await waitFor(() => expect(window.location.search).toContain('filter=name%3Aeq%3ARed'))
      const filteredIndex = getHistoryIndex()

      await act(async () => history.back())
      await waitFor(() => expect(window.location.search).not.toContain('filter'))
      await waitFor(() => expect(screen.getByTestId('filters')).toBeEmptyDOMElement())

      await act(async () => history.forward())
      await waitFor(() => expect(screen.getByTestId('filters')).toHaveTextContent('Red'))

      await settle()
      expect(getHistoryIndex()).toBe(filteredIndex)
      expect(window.location.search).toContain('filter=name%3Aeq%3ARed')
    } finally {
      cleanup()
    }
  })

  it('does not re-push restored filters, which would reorder params and drop Forward', async () => {
    const filteredSorted = `${unfiltered}&filter=name%3Aeq%3ARed&sort=name%3Aasc`
    const { history, cleanup } = await renderTableAt(filteredSorted)

    try {
      await waitFor(() => expect(screen.getByTestId('filters')).toHaveTextContent('Red'))
      await settle()
      const loadedIndex = getHistoryIndex()

      await act(async () => snap.setFilters([]))
      await waitFor(() => expect(window.location.search).not.toContain('filter'))
      expect(getHistoryIndex()).toBe(loadedIndex! + 1)

      await act(async () => history.back())
      await waitFor(() => expect(screen.getByTestId('filters')).toHaveTextContent('Red'))
      await settle()
      expect(getHistoryIndex()).toBe(loadedIndex)
      expect(window.location.pathname + window.location.search).toBe(filteredSorted)

      await act(async () => history.forward())
      await waitFor(() => expect(screen.getByTestId('filters')).toBeEmptyDOMElement())
      expect(getHistoryIndex()).toBe(loadedIndex! + 1)
    } finally {
      cleanup()
    }
  })
})
