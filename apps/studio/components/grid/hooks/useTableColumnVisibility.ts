import { useCallback, useEffect, useMemo } from 'react'

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
  const { hiddenColumns, setParams } = useTableEditorFiltersSort() // Get hiddenColumns from URL
  const snap = useTableEditorTableStateSnapshot()

  // Initialize column visibility once based on URL params
  // This ensures Valtio state reflects URL on first load
  useEffect(() => {
    if (!snap.setColumnVisibility || !snap.gridColumns) return

    // If URL has hidden columns, synchronize Valtio state with URL
    if (hiddenColumns.length > 0) {
      // First, ensure all columns are visible (reset state)
      snap.gridColumns.forEach((col) => {
        if (col.visible === false) {
          snap.setColumnVisibility(col.key, true)
        }
      })

      // Then hide columns based on URL parameters
      hiddenColumns.forEach((columnName) => {
        snap.setColumnVisibility(columnName, false)
      })
    }
    // We don't need an else case - if URL params are empty but Valtio has
    // hidden columns, we should keep those hidden (already in Valtio state)
  }, []) // Empty dependency array - run once on mount

  // Derive hidden columns Set directly from Valtio state
  const hiddenColumnsMemo = useMemo(() => {
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
      const currentHidden = new Set(hiddenColumnsMemo)
      currentHidden.add(columnName)
      const newHiddenArray = Array.from(currentHidden).sort()
      const newUrlString = newHiddenArray.join(',')
      setParams((prev) => ({ ...prev, hidden_cols: newUrlString || undefined }))

      // 2. Update Valtio State (after URL)
      snap.setColumnVisibility(columnName, false)
    },
    [snap, setParams, hiddenColumnsMemo] // Depend on snap, setParams, and current hidden set
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
      const currentHidden = new Set(hiddenColumnsMemo)
      currentHidden.delete(columnName)
      const newHiddenArray = Array.from(currentHidden).sort()
      const newUrlString = newHiddenArray.join(',')
      setParams((prev) => ({ ...prev, hidden_cols: newUrlString || undefined }))

      // 2. Update Valtio State (after URL)
      snap.setColumnVisibility(columnName, true)
    },
    [snap, setParams, hiddenColumnsMemo] // Depend on snap, setParams, and current hidden set
  )

  return {
    hiddenColumns: hiddenColumnsMemo,
    hideColumn,
    showColumn,
  }
}
