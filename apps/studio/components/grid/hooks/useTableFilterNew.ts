import { Filter } from 'components/grid/types'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

/**
 * Hook for managing table filters via the table editor state (snap).
 * This is the NEW hook for the new filter bar and should NOT be used by the old filter system.
 * For the old filter system, use useTableFilter instead.
 */
export function useTableFilterNew() {
  const snap = useTableEditorTableStateSnapshot()

  return {
    filters: snap.filters,
    setFilters: (filters: Filter[]) => snap.setFilters(filters),
    clearFilters: () => snap.clearFilters(),
  }
}
