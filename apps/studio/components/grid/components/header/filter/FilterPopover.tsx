import { useMemo } from 'react'

import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { FilterPopoverPrimitive } from './FilterPopoverPrimitive'

export interface FilterPopoverProps {
  portal?: boolean
}

export const FilterPopover = ({ portal = true }: FilterPopoverProps) => {
  const { urlFilters, onApplyFilters } = useTableFilter()

  // Convert string[] to Filter[]
  const filters = useMemo(() => {
    return formatFilterURLParams(urlFilters ?? [])
  }, [urlFilters])

  return (
    <FilterPopoverPrimitive portal={portal} filters={filters} onApplyFilters={onApplyFilters} />
  )
}
