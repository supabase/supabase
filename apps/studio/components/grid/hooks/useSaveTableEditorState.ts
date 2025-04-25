import { saveTableEditorStateToLocalStorage } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCallback } from 'react'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

/**
 * Hook for saving state and triggering side effects.
 */
export function useSaveTableEditorState() {
  const { project } = useProjectContext()
  // Use the safe snapshot hook - it returns a guaranteed object (real or default)
  const snap = useTableEditorTableStateSnapshot()

  const saveDataAndTriggerSideEffects = useCallback(
    (dataToSave: { filters?: string[]; sorts?: string[] }) => {
      const projectRef = project?.ref

      // No need for top-level snap check, safeSnap always returns an object.
      if (!projectRef) {
        console.warn(
          '[useSaveTableEditorState] ProjectRef missing, cannot save or trigger side effects.'
        )
        return
      }

      // --- Side Effects & Saving ---
      // Call methods directly. If snap is the default object, these are safe no-ops.
      try {
        // These calls are safe because defaultSnapshot provides no-op functions
        snap.setPage?.(1)
        snap.setEnforceExactCount?.(false)

        // Local Storage Save
        // Use optional chaining as table/name might be undefined in defaultSnapshot
        const tableName = snap.table?.name
        const schema = snap.table?.schema

        if (tableName) {
          saveTableEditorStateToLocalStorage({
            projectRef,
            tableName,
            schema,
            ...dataToSave,
          })
        } else {
          // Log if saving is skipped because table name is missing (likely due to default snap)
          console.warn('[useSaveTableEditorState] Table name missing, skipping localStorage save.')
        }
      } catch (error) {
        // Catch unexpected errors during property access or method calls
        console.error('[useSaveTableEditorState] Error during interaction with snapshot:', error)
      }
    },
    [snap, project] // Depend on the safe snap and project
  )

  const saveFiltersAndTriggerSideEffects = useCallback(
    (urlFilters: string[]) => saveDataAndTriggerSideEffects({ filters: urlFilters }),
    [saveDataAndTriggerSideEffects]
  )
  const saveSortsAndTriggerSideEffects = useCallback(
    (urlSorts: string[]) => saveDataAndTriggerSideEffects({ sorts: urlSorts }),
    [saveDataAndTriggerSideEffects]
  )

  return { saveFiltersAndTriggerSideEffects, saveSortsAndTriggerSideEffects }
}
