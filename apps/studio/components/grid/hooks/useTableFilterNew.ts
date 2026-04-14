import { Filter } from '@/components/grid/types'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

/**
 * Hook for managing table filters via the table editor state (snap).
 */
export function useTableFilter() {
  const snap = useTableEditorTableStateSnapshot()

  return {
    filters: snap.filters,
    setFilters: (filters: Filter[]) => snap.setFilters(filters),
    clearFilters: () => snap.clearFilters(),
  }
}
