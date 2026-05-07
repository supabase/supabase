import { useMemo } from 'react'

import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { FilterPopoverPrimitive } from './FilterPopoverPrimitive'

export const FilterPopover = () => {
  const { urlFilters, onApplyFilters } = useTableFilter()

  // Convert string[] to Filter[]
  const filters = useMemo(() => {
    return formatFilterURLParams(urlFilters ?? [])
  }, [urlFilters])

  return <FilterPopoverPrimitive filters={filters} onApplyFilters={onApplyFilters} />
}
