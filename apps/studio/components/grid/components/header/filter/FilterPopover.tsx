import { useMemo } from 'react'

import { FilterPopoverPrimitive } from './FilterPopoverPrimitive'
import { useTableFilter } from '@/components/grid/hooks/useTableFilter'
import { formatFilterURLParams } from '@/components/grid/SupabaseGrid.utils'

export const FilterPopover = () => {
  const { urlFilters, onApplyFilters } = useTableFilter()

  // Convert string[] to Filter[]
  const filters = useMemo(() => {
    return formatFilterURLParams(urlFilters ?? [])
  }, [urlFilters])

  return <FilterPopoverPrimitive filters={filters} onApplyFilters={onApplyFilters} />
}
