import { useCallback, useMemo } from 'react'

import { formatSortURLParams, sortsToUrlParams } from 'components/grid/SupabaseGrid.utils'
import type { Sort } from 'components/grid/types'
import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { useSaveTableEditorState } from './useSaveTableEditorState'

/**
 * Hook for managing table sort URL parameters and saving.
 * Uses snapshot ONLY to get table name for formatting/mapping.
 * Uses useSaveTableEditorState for saving and side effects.
 * Does NOT format initial sorts (needs table name externally).
 * Does NOT interact with snapshot directly.
 */
export function useTableSort() {
  const { sorts: urlSorts, setParams } = useTableEditorFiltersSort()
  const snap = useTableEditorTableStateSnapshot()
  const { saveSortsAndTriggerSideEffects } = useSaveTableEditorState()

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

      saveSortsAndTriggerSideEffects(newUrlSorts)
    },
    [snap, setParams, saveSortsAndTriggerSideEffects]
  )

  return {
    sorts,
    urlSorts,
    onApplySorts,
  }
}
