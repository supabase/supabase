import { useMemo } from 'react'
import { useTableEditorTableStateSnapshot, TableEditorTableState } from 'state/table-editor-table'

// Define a stable default state object shape with required methods/props
const defaultSnapshot: Partial<TableEditorTableState> = {
  table: undefined,
  setPage: () => {
    console.warn('[useSafeTableEditorSnapshot] Default setPage called')
  },
  setEnforceExactCount: () => {
    console.warn('[useSafeTableEditorSnapshot] Default setEnforceExactCount called')
  },
  // Add other properties accessed elsewhere if necessary, returning safe defaults
}

/**
 * A robust wrapper around useTableEditorTableStateSnapshot.
 * - Calls the original hook unconditionally.
 * - Catches errors during the snapshot hook call using a helper state.
 * - Returns a stable default object if the snapshot hook fails or returns falsy.
 * - Ensures the returned object always has a predictable shape (Partial<TableEditorTableState>).
 */
export function useSafeTableEditorSnapshot(): Partial<TableEditorTableState> {
  // Call the original hook unconditionally.
  // We need a way to know if it failed AFTER the call.
  let snap: TableEditorTableState | undefined | null = undefined
  let errorOccurred = false

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    snap = useTableEditorTableStateSnapshot()
  } catch (error) {
    console.error(
      '[useSafeTableEditorSnapshot] Error calling useTableEditorTableStateSnapshot:',
      error
    )
    errorOccurred = true // Mark that an error happened
  }

  // Use useMemo to decide whether to return the real snapshot or the default.
  // This decision happens AFTER the unconditional hook call.
  const safeSnap = useMemo(() => {
    // If an error occurred during the hook call OR if snap is falsy, return default.
    if (errorOccurred || !snap || typeof snap !== 'object') {
      console.warn(
        `[useSafeTableEditorSnapshot] Snapshot unavailable (error: ${errorOccurred}, type: ${typeof snap}), returning default.`
      )
      return defaultSnapshot
    }
    // Otherwise, return the actual snapshot.
    return snap
    // IMPORTANT: Depend on 'snap'. If snap changes (validly), we want to return the new one.
    // We don't need errorOccurred in deps as it only matters on the render it happens.
  }, [snap])

  return safeSnap
}
