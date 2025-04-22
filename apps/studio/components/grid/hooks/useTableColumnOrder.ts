import { useCallback, useMemo } from 'react'

import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'
import { useSafeTableEditorSnapshot } from './useSafeTableEditorSnapshot'
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
  const { setParams } = useTableEditorFiltersSort() // Only need setParams
  const snap = useSafeTableEditorSnapshot()

  // Read current order directly from Valtio State
  const columnOrder = useMemo(() => {
    return snap.gridColumns?.map((col) => col.key).filter((key) => key !== SELECT_COLUMN_KEY) ?? []
  }, [snap.gridColumns])

  /**
   * Sets the entire column order.
   * @param newOrder Array of column keys in the desired order.
   */
  const setColumnOrder = useCallback(
    (newOrder: string[]) => {
      const updateIdxAction = snap.updateColumnIdx
      if (!updateIdxAction) {
        console.warn('[useTableColumnOrder] Valtio updateColumnIdx action not available on snap.')
        return
      }

      // 1. Update Valtio State
      newOrder.forEach((columnKey, index) => {
        // Assuming 0-based index is handled correctly by updateColumnIdx or sorting logic
        updateIdxAction(columnKey, index)
      })

      // 2. Update URL Parameter
      const newUrlString = newOrder.join(',')
      setParams((prevParams) => ({
        ...prevParams,
        col_order: newUrlString || undefined,
      }))
    },
    [snap, setParams] // Depends on Valtio snap and setParams from central hook
  )

  /**
   * Moves a column to a position relative to another column.
   * @param sourceKey Key of the column to move.
   * @param targetKey Key of the column to move before.
   */
  const moveColumn = useCallback(
    (sourceKey: string, targetKey: string) => {
      if (!snap.moveColumn || !snap.gridColumns) {
        console.warn('[useTableColumnOrder] Valtio actions/gridColumns not available on snap.')
        return
      }

      // 1. Update Valtio State
      snap.moveColumn(sourceKey, targetKey)

      // 2. Update URL Parameter
      // Recalculate order locally for immediate URL update, as snap updates async
      const currentOrder = snap.gridColumns
        .map((col) => col.key)
        .filter((key) => key !== SELECT_COLUMN_KEY)

      const sourceIndex = currentOrder.indexOf(sourceKey)
      let targetIndex = currentOrder.indexOf(targetKey)

      if (sourceIndex === -1) {
        console.warn('Source key not found for moveColumn URL update')
        return
      }

      const newOrder = [...currentOrder]
      const [movedItem] = newOrder.splice(sourceIndex, 1)
      targetIndex = newOrder.indexOf(targetKey)

      if (targetIndex === -1) {
        // Default to end if target not found
        newOrder.push(movedItem)
      } else {
        newOrder.splice(targetIndex, 0, movedItem)
      }

      const newUrlString = newOrder.join(',')
      setParams((prevParams) => ({
        ...prevParams,
        col_order: newUrlString || undefined,
      }))
    },
    [snap, setParams] // Depends on Valtio snap and setParams from central hook
  )

  return {
    columnOrder,
    setColumnOrder,
    moveColumn,
  }
}
