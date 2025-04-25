import { useCallback, useMemo } from 'react'

import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

/**
 * Provides state and actions for managing table column visibility.
 *
 * Reads visibility state directly from the Valtio store.
 * Actions update the Valtio store first (triggering automatic persistence)
 * and then update the 'hidden_cols' URL parameter.
 */
export function useTableColumnVisibility() {
  const { setParams } = useTableEditorFiltersSort() // Only need setParams
  const snap = useTableEditorTableStateSnapshot()

  // Derive hidden columns Set directly from Valtio state
  const hiddenColumnsSet = useMemo(() => {
    const hidden = new Set<string>()
    snap.gridColumns?.forEach((col) => {
      // Consider a column hidden if its visible property is explicitly false
      if (col.visible === false) {
        hidden.add(col.key)
      }
    })
    return hidden
  }, [snap.gridColumns])

  /**
   * Hides a specific column.
   * @param columnName Key of the column to hide.
   */
  const hideColumn = useCallback(
    (columnName: string) => {
      if (!snap.setColumnVisibility || !snap.gridColumns) {
        console.warn('[useTableColumnVisibility] Valtio action/state not available.')
        return
      }
      // 1. Update URL Parameter first
      // Construct the new list of hidden keys based on the INTENDED state change
      const currentHidden = new Set(hiddenColumnsSet)
      currentHidden.add(columnName)
      const newHiddenArray = Array.from(currentHidden).sort()
      const newUrlString = newHiddenArray.join(',')
      setParams((prev) => ({ ...prev, hidden_cols: newUrlString || undefined }))

      // 2. Update Valtio State (after URL)
      snap.setColumnVisibility(columnName, false)
    },
    [snap, setParams, hiddenColumnsSet] // Depend on snap, setParams, and current hidden set
  )

  /**
   * Shows a specific column.
   * @param columnName Key of the column to show.
   */
  const showColumn = useCallback(
    (columnName: string) => {
      if (!snap.setColumnVisibility || !snap.gridColumns) {
        console.warn('[useTableColumnVisibility] Valtio action/state not available.')
        return
      }
      // 1. Update URL Parameter first
      // Construct the new list of hidden keys based on the INTENDED state change
      const currentHidden = new Set(hiddenColumnsSet)
      currentHidden.delete(columnName)
      const newHiddenArray = Array.from(currentHidden).sort()
      const newUrlString = newHiddenArray.join(',')
      setParams((prev) => ({ ...prev, hidden_cols: newUrlString || undefined }))

      // 2. Update Valtio State (after URL)
      snap.setColumnVisibility(columnName, true)
    },
    [snap, setParams, hiddenColumnsSet] // Depend on snap, setParams, and current hidden set
  )

  return {
    hiddenColumns: hiddenColumnsSet,
    hideColumn,
    showColumn,
  }
}
