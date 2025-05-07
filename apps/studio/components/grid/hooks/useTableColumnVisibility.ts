import { useCallback, useMemo } from 'react'

import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

/**
 * Provides state and actions for managing table column visibility.
 *
 * Reads visibility state directly from the Valtio store.
 * Actions update the URL parameter first (triggering route update with the new state)
 * and then update the Valtio store (triggering automatic persistence to localStorage).
 */
export function useTableColumnVisibility() {
  const { hiddenColumns, setParams } = useTableEditorFiltersSort() // Get hiddenColumns from URL
  const snap = useTableEditorTableStateSnapshot()

  // Read hidden columns directly from URL parameters
  const hiddenColumnsMemo = useMemo(() => {
    return new Set(hiddenColumns)
  }, [hiddenColumns])

  /**
   * Hide a specific column.
   */
  const hideColumn = useCallback(
    (columnName: string) => {
      if (!snap.setColumnVisibility || !snap.gridColumns) {
        console.warn('[useTableColumnVisibility] Valtio action/state not available.')
        return
      }

      // 1. Update URL Parameter first
      const currentHidden = new Set(hiddenColumns)
      currentHidden.add(columnName)
      const newHiddenArray = Array.from(currentHidden).sort()
      const newUrlString = newHiddenArray.join(',')
      setParams((prev) => ({ ...prev, hidden_cols: newUrlString || undefined }))

      // 2. Update Valtio State (after URL)
      snap.setColumnVisibility(columnName, false)
    },
    [snap, setParams, hiddenColumns]
  )

  /**
   * Show a specific column.
   */
  const showColumn = useCallback(
    (columnName: string) => {
      if (!snap.setColumnVisibility || !snap.gridColumns) {
        console.warn('[useTableColumnVisibility] Valtio action/state not available.')
        return
      }

      // 1. Update URL Parameter first
      const currentHidden = new Set(hiddenColumns)
      currentHidden.delete(columnName)
      const newHiddenArray = Array.from(currentHidden).sort()
      const newUrlString = newHiddenArray.join(',')
      setParams((prev) => ({ ...prev, hidden_cols: newUrlString || undefined }))

      // 2. Update Valtio State (after URL)
      snap.setColumnVisibility(columnName, true)
    },
    [snap, setParams, hiddenColumns]
  )

  return {
    hiddenColumns: hiddenColumnsMemo,
    hideColumn,
    showColumn,
  }
}
