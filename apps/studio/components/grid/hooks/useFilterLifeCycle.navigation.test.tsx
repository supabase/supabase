import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import { flushSync } from 'react-dom'
import { describe, expect, it, vi } from 'vitest'

import { useInitializeFiltersFromUrl, useSyncFiltersToUrl } from './useFilterLifeCycle'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { ForeignTable } from '@/data/table-editor/table-editor-types'
import { useTableEditorFiltersSort } from '@/hooks/misc/useTableEditorFiltersSort'
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
let sortParams: ReturnType<typeof useTableEditorFiltersSort>

function FiltersProbe() {
  snap = useTableEditorTableStateSnapshot()
  useInitializeFiltersFromUrl()
  useSyncFiltersToUrl()
  return <output data-testid="filters">{snap.filters.map((f) => f.value).join(',')}</output>
}

// A separate instance, like the sort controls.
function SortProbe() {
  sortParams = useTableEditorFiltersSort()
  return null
}

const getHistoryIndex = () => (window.history.state as { __TSR_index?: number }).__TSR_index

async function renderTableAt(url: string) {
  window.history.replaceState(null, '', url)
  const history = createBrowserHistory()
  // Browsers run microtasks between `popstate` listeners, so React renders (and runs effects for)
  // the router's update before the hook's own listener. jsdom doesn't; flush here to match.
  const flushReact = () => flushSync(() => {})
  window.addEventListener('popstate', flushReact)
  const root = createRootRoute({ component: Outlet })
  const route = createRoute({
    getParentRoute: () => root,
    path: '/project/$ref/editor/$id',
    component: () => (
      <TableEditorTableStateContextProvider projectRef="default" table={table}>
        <FiltersProbe />
        <SortProbe />
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
      window.removeEventListener('popstate', flushReact)
    },
  }
}

// Outlasts the 500ms state → URL debounce, so any sync push would have landed.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 700)))

const red = { column: 'name', operator: '=' as const, value: 'Red' }
const filteredByRed = `${unfiltered}&filter=name%3Aeq%3ARed`

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

  it('discards a pending edit on Back to an entry that differs only by sort', async () => {
    const { history, cleanup } = await renderTableAt(filteredByRed)

    try {
      await waitFor(() => expect(screen.getByTestId('filters')).toHaveTextContent('Red'))
      await settle()
      const unsortedIndex = getHistoryIndex()
      await act(async () => sortParams.setParams((prev) => ({ ...prev, sort: ['name:asc'] })))
      await waitFor(() => expect(window.location.search).toContain('sort='))

      // Edit, then Back before the debounced push; the router's popstate listener runs first
      await act(async () => snap.setFilters([{ ...red, value: 'Green' }]))
      await act(async () => history.back())
      await settle()

      expect(screen.getByTestId('filters')).toHaveTextContent('Red')
      expect(window.location.pathname + window.location.search).toBe(filteredByRed)
      expect(getHistoryIndex()).toBe(unsortedIndex)
    } finally {
      cleanup()
    }
  })

  it("builds a later sort push on the current URL, not the router's lagging query", async () => {
    const { cleanup } = await renderTableAt(unfiltered)

    try {
      await act(async () => snap.setFilters([red]))
      await waitFor(() => expect(window.location.search).toContain('filter=name%3Aeq%3ARed'))
      await settle()

      await act(async () => sortParams.setParams((prev) => ({ ...prev, sort: ['name:asc'] })))
      await waitFor(() => expect(window.location.search).toContain('sort=name%3Aasc'))
      expect(window.location.search).toContain('filter=name%3Aeq%3ARed')

      await act(async () => sortParams.setParams((prev) => ({ ...prev, sort: [] })))
      await waitFor(() => expect(window.location.search).not.toContain('sort='))
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
