import { useMemo } from 'react'

import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import SortPopoverPrimitive from './SortPopoverPrimitive'

export interface SortPopoverProps {
  portal?: boolean
}

const SortPopover = ({ portal = true }: SortPopoverProps) => {
  const { urlSorts, onApplySorts } = useTableSort()

  // Convert string[] to Sort[]
  const sorts = useMemo(() => {
    const { tableState } = window as any
    const tableName = tableState?.table?.name || ''
    return tableName ? formatSortURLParams(tableName, urlSorts ?? []) : []
  }, [urlSorts])

  return <SortPopoverPrimitive portal={portal} sorts={sorts} onApplySorts={onApplySorts} />
}

export default SortPopover
