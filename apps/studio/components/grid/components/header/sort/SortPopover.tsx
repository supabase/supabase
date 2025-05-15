import { useMemo } from 'react'

import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { SortPopoverPrimitive } from './SortPopoverPrimitive'

export const SortPopover = () => {
  const { urlSorts, onApplySorts } = useTableSort()
  const tableState = useTableEditorTableStateSnapshot()
  const tableName = tableState?.table?.name || ''

  // Convert string[] to Sort[]
  const sorts = useMemo(() => {
    return tableName && urlSorts ? formatSortURLParams(tableName, urlSorts) : []
  }, [tableName, urlSorts])

  return <SortPopoverPrimitive sorts={sorts} onApplySorts={onApplySorts} />
}
