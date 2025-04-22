import { useMemo } from 'react'

import { useTableEditorTableStateSnapshot, TableEditorTableState } from 'state/table-editor-table'

// Define a stable default state object shape with required methods/props
const defaultSnapshot: Partial<TableEditorTableState> = {
  table: undefined,
  gridColumns: [], // Add gridColumns with a default empty array for safety
  setPage: () => {
    console.warn('[useSafeTableEditorSnapshot] Default setPage called')
  },
  // Add other necessary default methods/props if hooks rely on them
  // e.g., updateColumnIdx, moveColumn, setColumnVisibility
  updateColumnIdx: () => {
    console.warn('[useSafeTableEditorSnapshot] Default updateColumnIdx called')
  },
  moveColumn: () => {
    console.warn('[useSafeTableEditorSnapshot] Default moveColumn called')
  },
  setColumnVisibility: () => {
    console.warn('[useSafeTableEditorSnapshot] Default setColumnVisibility called')
  },
}

/**
 * Wraps useTableEditorTableStateSnapshot to provide a stable default snapshot
 * when the real snapshot is unavailable (e.g., during initial load or context issues).
 * This prevents downstream hooks/components from crashing if the context is missing.
 * NOTE: Error handling during hook execution should ideally be handled by React Error Boundaries.
 */
export function useSafeTableEditorSnapshot(): Partial<TableEditorTableState> {
  // Directly call the hook - errors should propagate to an Error Boundary
  const snap = useTableEditorTableStateSnapshot()

  // Use useMemo to decide whether to return the real snapshot or the default.
  const safeSnap = useMemo(() => {
    // If snap is falsy OR if snap.gridColumns is falsy, return default.
    // Checks if the necessary parts of the snapshot are available.
    if (!snap || typeof snap !== 'object' || !snap.gridColumns) {
      console.warn(
        `[useSafeTableEditorSnapshot] Snapshot unavailable or invalid (snap type: ${typeof snap}), returning default.`
      )
      return defaultSnapshot
    }

    // Return the valid snapshot
    return snap
  }, [snap]) // Only depends on the snap object itself

  return safeSnap
}
