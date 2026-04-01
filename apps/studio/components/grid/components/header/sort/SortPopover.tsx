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
  const tableName = snap.table?.name || ''

  // Convert string[] to Sort[]
  const sorts = useMemo(() => {
    return tableName && urlSorts ? formatSortURLParams(tableName, urlSorts) : []
  }, [tableName, urlSorts])

  return (
    <SortPopoverPrimitive
      sorts={sorts}
      onApplySorts={onApplySorts}
      tableQueriesEnabled={tableQueriesEnabled}
    />
  )
}
