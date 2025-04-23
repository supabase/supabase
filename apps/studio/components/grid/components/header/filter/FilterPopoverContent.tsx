import { isEqual } from 'lodash'
import { Plus } from 'lucide-react'
import { KeyboardEvent, useCallback, useMemo } from 'react'

import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { Filter } from 'components/grid/types'
import { Button, PopoverSeparator_Shadcn_ } from 'ui'
import FilterRow from './FilterRow'

export interface FilterPopoverContentProps {
  filters: Filter[]
  initialFilters: Filter[]
  onChangeFilter: (index: number, filter: Filter) => void
  onDeleteFilter: (index: number) => void
  onAddFilter: () => void
  onApplyFilters: (filters: Filter[]) => void
}

const FilterPopoverContent = ({
  filters,
  initialFilters,
  onChangeFilter,
  onDeleteFilter,
  onAddFilter,
  onApplyFilters,
}: FilterPopoverContentProps) => {
  const snap = useTableEditorTableStateSnapshot()

  const onSelectApplyFilters = () => {
    // [Joshen] Trim empty spaces in input for only UUID type columns
    const formattedFilters = filters.map((f) => {
      const column = snap.table.columns.find((c) => c.name === f.column)
      if (column?.format === 'uuid') return { ...f, value: f.value.trim() }
      else return f
    })
    onApplyFilters(formattedFilters)
  }

  function handleEnterKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') onSelectApplyFilters()
  }

  return (
    <div className="space-y-2 py-2">
      <div className="space-y-2">
        {filters.map((filter, index) => (
          <FilterRow
            key={`filter-${filter.column}-${[index]}`}
            filter={filter}
            filterIdx={index}
            onChange={onChangeFilter}
            onDelete={onDeleteFilter}
            onKeyDown={handleEnterKeyDown}
          />
        ))}
        {filters.length == 0 && (
          <div className="space-y-1 px-3">
            <h5 className="text-sm text-foreground-light">No filters applied to this view</h5>
            <p className="text-xs text-foreground-lighter">Add a column below to filter the view</p>
          </div>
        )}
      </div>
      <PopoverSeparator_Shadcn_ />
      <div className="px-3 flex flex-row justify-between">
        <Button icon={<Plus />} type="text" onClick={onAddFilter}>
          Add filter
        </Button>
        <Button
          disabled={isEqual(filters, initialFilters)}
          type="default"
          onClick={() => onSelectApplyFilters()}
        >
          Apply filter
        </Button>
      </div>
    </div>
  )
}

export default FilterPopoverContent
