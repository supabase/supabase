import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useParams,
  type AnyRouter,
} from '@tanstack/react-router'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useMemo } from 'react'
import { describe, expect, it, vi } from 'vitest'

import Link from '@/compat/next/link'
import { useSyncFiltersToUrl } from '@/components/grid/hooks/useFilterLifeCycle'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import {
  createTableEditorTableState,
  TableEditorTableStateContext,
} from '@/state/table-editor-table'

vi.mock('next/router', () => import('@/compat/next/router'))

function FilterSync() {
  useSyncFiltersToUrl()
  return null
}

function TablePage() {
  const { id } = useParams<AnyRouter, undefined, false>({ strict: false })
  const state = useMemo(
    () =>
      createTableEditorTableState({
        projectRef: 'default',
        table: {
          id: Number(id),
          schema: 'public',
          name: `table_${id}`,
          entity_type: ENTITY_TYPE.FOREIGN_TABLE,
          comment: null,
          columns: [],
          foreign_server_name: 'fixture',
          foreign_data_wrapper_name: 'fixture',
          foreign_data_wrapper_handler: 'fixture',
        },
        onAddColumn: vi.fn(),
        onExpandJSONEditor: vi.fn(),
        onExpandTextEditor: vi.fn(),
      }),
    [id]
  )

  return (
    <TableEditorTableStateContext.Provider value={state}>
      <FilterSync key={id} />
      <output data-testid="table">{id}</output>
      <Link href="/project/default/editor/17607?schema=public&extra=kept#selection">Table B</Link>
      <Link href="/project/default/editor/17489?schema=public&extra=kept#selection">Table A</Link>
      <button
        tabIndex={0}
        onClick={() => state.setFilters([{ column: 'id', operator: '=', value: '1' }])}
      >
        Filter rows
      </button>
      <button
        tabIndex={0}
        onClick={() => state.setFilters([{ column: 'id', operator: '=', value: '2' }])}
      >
        Change filter
      </button>
    </TableEditorTableStateContext.Provider>
  )
}

// Allow the production filter synchronizer's 500ms debounce to finish before traversing.
const settleFilters = () => act(async () => new Promise((resolve) => setTimeout(resolve, 650)))

for (const basepath of ['/', '/dashboard']) {
  describe(`table filter history at ${basepath}`, () => {
    it.each([false, true])(
      'preserves repeated Back/Forward with retained application state: %s',
      async (hasApplicationState) => {
        const prefix = basepath === '/' ? '' : basepath
        const tableA = `${prefix}/project/default/editor/17489?schema=public&extra=kept#selection`
        const tableB = `${prefix}/project/default/editor/17607?schema=public&extra=kept#selection`
        window.history.replaceState(null, '', tableA)
        const history = createBrowserHistory()
        const root = createRootRoute({ component: Outlet })
        const table = createRoute({
          getParentRoute: () => root,
          path: '/project/$ref/editor/$id',
          component: TablePage,
        })
        const router = createRouter({
          routeTree: root.addChildren([table]),
          history,
          basepath,
          parseSearch,
          stringifySearch,
          isServer: false,
        })
        await router.load()
        const view = render(<RouterProvider router={router} />)
        const push = vi.spyOn(window.history, 'pushState')

        try {
          await settleFilters()
          if (hasApplicationState) {
            const retainedState = { ...history.location.state, legacyState: 'retained' }
            await act(async () => history.replace(tableA, retainedState))
          }
          fireEvent.click(screen.getByText('Table B'))
          await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('17607'))
          await settleFilters()

          for (let cycle = 0; cycle < 2; cycle++) {
            push.mockClear()
            act(() => window.history.back())
            await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('17489'))
            await settleFilters()
            expect(window.location.pathname + window.location.search + window.location.hash).toBe(
              tableA
            )
            expect(push).not.toHaveBeenCalled()
            if (hasApplicationState) expect(window.history.state.legacyState).toBe('retained')

            act(() => window.history.forward())
            await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('17607'))
            await settleFilters()
            expect(window.location.pathname + window.location.search + window.location.hash).toBe(
              tableB
            )
          }

          fireEvent.click(screen.getByText('Filter rows'))
          await waitFor(() => expect(window.location.search).toContain('filter=id%3Aeq%3A1'))
          expect(window.location.search).toContain('schema=public')
          expect(window.location.search).toContain('extra=kept')
          expect(window.location.hash).toBe('#selection')

          // Leaving before the next debounce must cancel the old table's pending URL update.
          fireEvent.click(screen.getByText('Change filter'))
          await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
          fireEvent.click(screen.getByText('Table A'))
          await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('17489'))
          await settleFilters()
          expect(window.location.pathname + window.location.search + window.location.hash).toBe(
            tableA
          )
        } finally {
          view.unmount()
          push.mockRestore()
          history.destroy()
        }
      },
      10000
    )
  })
}
