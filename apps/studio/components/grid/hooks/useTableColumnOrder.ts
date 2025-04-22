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
  const { columnOrder, setParams } = useTableEditorFiltersSort()
  const snap = useSafeTableEditorSnapshot()

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
   * @param sourceKey Key of the column being moved.
   * @param targetKey Key of the column being hovered over.
   * @param sourceIndex Original index of the source column.
   * @param targetIndex Index of the target column (where source should move to).
   */
  const moveColumn = useCallback(
    (sourceKey: string, targetKey: string, sourceIndex: number, targetIndex: number) => {
      // Use the provided indices for accurate array manipulation
      const currentOrder = columnOrder // Based on last committed URL state

      // Check if indices match the keys in the current known order (optional defensive check)
      if (currentOrder[sourceIndex] !== sourceKey || currentOrder[targetIndex] !== targetKey) {
        console.warn('DnD indices/keys mismatch with current hook state. Recalculating indices.')
        // Fallback to recalculating indices based on keys if mismatch detected
        sourceIndex = currentOrder.indexOf(sourceKey)
        targetIndex = currentOrder.indexOf(targetKey)
        if (sourceIndex === -1 || targetIndex === -1) {
          console.error('Cannot resolve index mismatch during column move.')
          return
        }
      }

      // Reliable way to move element in array using indices
      const element = currentOrder[sourceIndex]
      const newOrder = [...currentOrder]
      newOrder.splice(sourceIndex, 1) // Remove element from original position
      newOrder.splice(targetIndex, 0, element) // Insert element at target position

      // 1. Update URL Parameter with the locally calculated order first
      const newUrlString = newOrder.join(',')
      setParams((prevParams) => ({
        ...prevParams,
        col_order: newUrlString || undefined,
      }))

      // Update Valtio state (best effort for eventual consistency)
      if (snap.moveColumn) {
        snap.moveColumn(sourceKey, targetKey)
      } else {
        console.warn('[useTableColumnOrder] snap.moveColumn not available')
      }
    },
    // Depends on the order derived from URL, the Valtio snap, and setParams
    [columnOrder, snap, setParams]
  )

  return {
    columnOrder: columnOrderMemo,
    setColumnOrder,
    moveColumn,
  }
}
