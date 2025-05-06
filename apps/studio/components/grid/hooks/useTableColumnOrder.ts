import { useCallback, useMemo } from 'react'

import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

import { SELECT_COLUMN_KEY } from 'components/grid/constants'

// Remove dependency on useSaveTableEditorState

/**
 * Provides state and actions for managing table column order.
 *
 * Reads the order directly from the Valtio store (via useSafeTableEditorSnapshot).
 * Actions update the Valtio store first (triggering automatic persistence)
 * and then update the 'col_order' URL parameter via setParams from the central hook.
 */
export function useTableColumnOrder() {
  const { columnOrder, setParams } = useTableEditorFiltersSort()
  const snap = useTableEditorTableStateSnapshot()

  // Read current order directly from Valtio State
  const columnOrderMemo = useMemo(() => {
    return columnOrder.filter((key) => key !== SELECT_COLUMN_KEY)
  }, [columnOrder])

  /**
   * Sets the entire column order.
   * @param newOrder Array of column keys in the desired order.
   */
  const setColumnOrder = useCallback(
    (newOrder: string[]) => {
      // 1. Update URL Parameter first
      const newUrlString = newOrder.join(',')
      setParams((prevParams) => ({
        ...prevParams,
        col_order: newUrlString || undefined,
      }))

      const updateIdxAction = snap.updateColumnIdx
      if (!updateIdxAction) {
        console.warn('[useTableColumnOrder] Valtio updateColumnIdx action not available on snap.')
        return
      }

      // 2. Update Valtio State (after URL)
      newOrder.forEach((columnKey, index) => {
        // Assuming 0-based index is handled correctly by updateIdxAction or sorting logic
        updateIdxAction(columnKey, index)
      })
    },
    [snap, setParams] // Depends on Valtio snap and setParams from central hook
  )

  /**
   * Moves a column based on drag-and-drop indices.
   * Intended for live updates during drag (hover).
   */
  const moveColumn = useCallback(
    (sourceKey: string, targetKey: string, sourceIndex: number, targetIndex: number) => {
      // Always recalculate indices based on the actual columnOrder to avoid discrepancies
      const currentOrder = [...columnOrder] // Clone to avoid direct mutation
      const actualSourceIndex = currentOrder.indexOf(sourceKey)
      const actualTargetIndex = currentOrder.indexOf(targetKey)

      // If either column is not found, we can't proceed
      if (actualSourceIndex === -1 || actualTargetIndex === -1) {
        console.error(
          'Column not found in current order:',
          actualSourceIndex === -1 ? sourceKey : targetKey
        )
        return
      }

      // Remove the source column and insert it at the target position
      const newOrder = [...currentOrder]
      newOrder.splice(actualSourceIndex, 1)
      newOrder.splice(actualTargetIndex, 0, sourceKey)

      // First update the URL parameters for immediate visual feedback
      const newUrlString = newOrder.join(',')
      setParams((prevParams) => ({
        ...prevParams,
        col_order: newUrlString || undefined,
      }))

      // Use setColumnOrder which properly handles updating all columns at once
      setColumnOrder(newOrder)
    },
    [columnOrder, setParams, setColumnOrder]
  )

  return {
    columnOrder: columnOrderMemo,
    setColumnOrder,
    moveColumn,
  }
}
