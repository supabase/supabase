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
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_KEY_PREFIX } from './constants'
import {
  loadTableEditorStateFromLocalStorage,
  useSyncTableEditorStateFromLocalStorageWithUrl,
} from './SupabaseGrid.utils'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { ForeignTable } from '@/data/table-editor/table-editor-types'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

vi.mock('next/navigation', () => import('@/compat/next/navigation'))
vi.mock('nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('nuqs')>()),
  useQueryStates: () => [{}, vi.fn()],
}))

const tableA = '/project/default/editor/1?schema=public&filter=id%3Aeq%3A2'
const tableB = '/project/default/editor/2?schema=public'

// The hook only reads `id`; a foreign table is the smallest complete `Entity`.
const getTable = (id: number): ForeignTable => ({
  entity_type: ENTITY_TYPE.FOREIGN_TABLE,
  id,
  schema: 'public',
  name: `table_${id}`,
  comment: null,
  foreign_server_name: '',
  foreign_data_wrapper_name: '',
  foreign_data_wrapper_handler: '',
  columns: [],
})

function TablePage() {
  const { id } = useParams<AnyRouter, undefined, false>({ strict: false })
  useSyncTableEditorStateFromLocalStorageWithUrl({
    projectRef: 'default',
    table: getTable(Number(id)),
  })
  return <output data-testid="table">{id}</output>
}

afterEach(() => {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}_default`)
  sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}_default`)
})

describe('useSyncTableEditorStateFromLocalStorageWithUrl', () => {
  it('saves filters only under the table the URL belongs to while navigation is pending', async () => {
    window.history.replaceState(null, '', tableA)
    const history = createBrowserHistory()
    const root = createRootRoute({ component: Outlet })
    const table = createRoute({
      getParentRoute: () => root,
      path: '/project/$ref/editor/$id',
      // Keeps the old route params rendered after the location has already moved on.
      loader: () => new Promise((resolve) => setTimeout(resolve, 50)),
      component: TablePage,
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
      await waitFor(() =>
        expect(loadTableEditorStateFromLocalStorage('default', 1)?.filters).toEqual(['id:eq:2'])
      )

      await act(async () => history.push(tableB))
      await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('2'))
      await waitFor(() =>
        expect(loadTableEditorStateFromLocalStorage('default', 2)?.filters).toEqual([])
      )
      expect(loadTableEditorStateFromLocalStorage('default', 1)?.filters).toEqual(['id:eq:2'])

      await act(async () => history.back())
      await waitFor(() => expect(screen.getByTestId('table')).toHaveTextContent('1'))
      expect(loadTableEditorStateFromLocalStorage('default', 2)?.filters).toEqual([])
      expect(loadTableEditorStateFromLocalStorage('default', 1)?.filters).toEqual(['id:eq:2'])
    } finally {
      view.unmount()
      history.destroy()
    }
  })
})
