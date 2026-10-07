import { useRouter } from 'next/router'

import { formatFilterURLParams, getTableIdFromPath } from '@/components/grid/SupabaseGrid.utils'
import { Filter } from '@/components/grid/types'
import { useTableEditorFiltersSort } from '@/hooks/misc/useTableEditorFiltersSort'
import { useOptionalTableEditorTableStateSnapshot } from '@/state/table-editor-table'

/**
 * Hook for managing table filters.
 *
 * When called inside a TableEditorTableStateContextProvider, reads/writes
 * filters via the valtio table state. When called outside (e.g. the sidebar),
 * falls back to reading filters from URL params. Mutations (setFilters,
 * clearFilters) throw if called outside the provider.
 */
export function useTableFilter() {
  const snap = useOptionalTableEditorTableStateSnapshot()
  const { filters: urlFilters } = useTableEditorFiltersSort()
  const urlParsedFilters = formatFilterURLParams(urlFilters)

  const filters = snap ? snap.filters : urlParsedFilters

  return {
    filters,
    setFilters: (filters: Filter[]) => {
      if (!snap) {
        throw new Error('useTableFilter: setFilters requires TableEditorTableStateContextProvider')
      }
      snap.setFilters(filters)
    },
    clearFilters: () => {
      if (!snap) {
        throw new Error(
          'useTableFilter: clearFilters requires TableEditorTableStateContextProvider'
        )
      }
      snap.clearFilters()
    },
  }
}

/**
 * URL filters for `tableId`, for callers outside the table state provider (e.g. the sidebar).
 * `undefined` while the URL belongs to another table: under TanStack the URL moves to the next
 * table before route params do.
 */
export function useUrlTableFilters(tableId: number): Filter[] | undefined {
  const { asPath } = useRouter()
  const { filters } = useTableFilter()
  return getTableIdFromPath(asPath) === String(tableId) ? filters : undefined
}
