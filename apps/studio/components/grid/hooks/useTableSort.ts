import { useCallback, useMemo } from 'react'

import { formatSortURLParams, sortsToUrlParams } from 'components/grid/SupabaseGrid.utils'
import type { Sort } from 'components/grid/types'
import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

/**
 * Hook for managing table sort URL parameters and saving.
 * Uses snapshot ONLY to get table name for formatting/mapping.
 * Does NOT format initial sorts (needs table name externally).
 * Does NOT interact with snapshot directly.
 */
export function useTableSort() {
  const { sorts: urlSorts, setParams } = useTableEditorFiltersSort()
  const snap = useTableEditorTableStateSnapshot()

  const tableName = useMemo(() => snap.table?.name || '', [snap])

  const sorts = useMemo(() => {
    return formatSortURLParams(tableName, urlSorts)
  }, [tableName, urlSorts])

  const onApplySorts = useCallback(
    (appliedSorts: Sort[]) => {
      if (!tableName) {
        return console.warn(
          '[useTableSort] Table name missing in callback, cannot apply sort correctly.'
        )
      }

      const sortsWithTable = appliedSorts.map((sort) => ({ ...sort, table: tableName }))
      const newUrlSorts = sortsToUrlParams(sortsWithTable)

      setParams((prevParams) => ({ ...prevParams, sort: newUrlSorts }))
    },
    [snap, setParams]
  )

  /**
   * Adds a new sort for a column or updates the direction of an existing one.
   * New sorts are added to the beginning of the array (highest precedence).
   * If the column already exists, its `ascending` direction is updated.
   * Calls `onApplySorts` to update URL parameters and trigger side effects.
   *
   * @param columnKey The key/name of the column to sort.
   * @param ascending The sort direction (true for ascending, false for descending).
   */
  const addOrUpdateSort = useCallback(
    (columnKey: string, ascending: boolean) => {
      if (!tableName || !columnKey) return

      // Use the derived 'sorts' state from the hook
      const existingSortIndex = sorts.findIndex((s) => s.column === columnKey)
      let newSorts = [...sorts] // Create a mutable copy

      if (existingSortIndex !== -1) {
        // Column already exists in sorts: Update the existing sort (toggle handled by removeSort)
        newSorts[existingSortIndex] = { ...newSorts[existingSortIndex], ascending: ascending }
      } else {
        // Column doesn't exist in sorts: Add it to the beginning
        newSorts.unshift({ table: tableName, column: columnKey, ascending: ascending })
      }

      onApplySorts(newSorts)
    },
    [tableName, sorts, onApplySorts] // Depend on derived sorts and callback
  )

  /**
   * Removes a sort criterion for a specific column.
   * Calls `onApplySorts` with the filtered array to update URL parameters and trigger side effects.
   *
   * @param columnKey The key/name of the column to remove from sorting.
   */
  const removeSort = useCallback(
    (columnKey: string) => {
      if (!tableName || !columnKey) return

      // Use the derived 'sorts' state from the hook
      const newSorts = sorts.filter((s) => s.column !== columnKey)
      onApplySorts(newSorts)
    },
    [tableName, sorts, onApplySorts] // Depend on derived sorts and callback
  )

  return {
    sorts,
    urlSorts,
    onApplySorts,
    addOrUpdateSort,
    removeSort,
  }
}
