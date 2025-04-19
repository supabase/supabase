import { useCallback, useMemo } from 'react'
import type { Sort } from 'components/grid/types'
import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'
import { formatSortURLParams, sortsToUrlParams } from 'components/grid/SupabaseGrid.utils'
import { useSaveTableEditorState } from './useSaveTableEditorState'
import { useSafeTableEditorSnapshot } from './useSafeTableEditorSnapshot'

/**
 * Hook for managing table sort URL parameters and saving.
 * Uses safe snapshot ONLY to get table name for formatting/mapping.
 * Uses useSaveTableEditorState for saving and side effects.
 * Does NOT format initial sorts (needs table name externally).
 * Does NOT interact with snapshot directly.
 */
export function useTableSort() {
  const { sorts: urlSorts, setParams } = useTableEditorFiltersSort()
  const snap = useSafeTableEditorSnapshot()
  const { saveSortsAndTriggerSideEffects } = useSaveTableEditorState()

  const tableName = useMemo(() => {
    return snap.table?.name || ''
  }, [snap])

  const sorts = useMemo(() => {
    return formatSortURLParams(tableName, urlSorts)
  }, [tableName, urlSorts])

  const onApplySorts = useCallback(
    (appliedSorts: Sort[]) => {
      const localTableName = snap.table?.name || ''

      if (!localTableName) {
        console.warn('[useTableSort] Table name missing in callback, cannot apply sort correctly.')
        return
      }

      const sortsWithTable = appliedSorts.map((sort) => ({ ...sort, table: localTableName }))
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
