import { Filter } from 'components/grid/types'
import FilterPopover from 'components/grid/components/header/filter/FilterPopover'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { useEffect, useState } from 'react'

interface FilterPopoverWrapperProps {
  filters: string[]
  onApplyFilters: (filters: Filter[]) => void
  portal?: boolean
}

const FilterPopoverWrapper = ({ filters, onApplyFilters, portal }: FilterPopoverWrapperProps) => {
  return <FilterPopover portal={portal} onApplyFilters={onApplyFilters} />
}

export default FilterPopoverWrapper
