import { useMemo } from 'react'

import { SortPopoverPrimitive } from './SortPopoverPrimitive'
import { useTableSort } from '@/components/grid/hooks/useTableSort'
import { formatSortURLParams } from '@/components/grid/SupabaseGrid.utils'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export interface SortPopoverProps {
  tableQueriesEnabled?: boolean
}

export const SortPopover = ({ tableQueriesEnabled }: SortPopoverProps) => {
  const { urlSorts, onApplySorts } = useTableSort()

  const snap = useTableEditorTableStateSnapshot()

  // Convert string[] to Sort[]
  const sorts = useMemo(() => {
    return snap.originalTable && urlSorts ? formatSortURLParams(snap.originalTable, urlSorts) : []
  }, [snap.originalTable, urlSorts])

  return (
    <SortPopoverPrimitive
      sorts={sorts}
      onApplySorts={onApplySorts}
      tableQueriesEnabled={tableQueriesEnabled}
    />
  )
}
