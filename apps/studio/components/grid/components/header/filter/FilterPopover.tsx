import update from 'immutability-helper'
import { isEqual } from 'lodash'
import { FilterIcon, Plus } from 'lucide-react'
import { KeyboardEvent, useCallback, useMemo, useState } from 'react'

import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import type { Filter } from 'components/grid/types'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import FilterRow from './FilterRow'

export interface FilterPopoverProps {
  filters: string[]
  onApplyFilters: (filters: Filter[]) => void
}

const FilterPopover = ({ filters, onApplyFilters }: FilterPopoverProps) => {
  const [open, setOpen] = useState(false)

  const btnText =
    (filters || []).length > 0
      ? `Filtered by ${filters.length} rule${filters.length > 1 ? 's' : ''}`
      : 'Filter'

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={(filters || []).length > 0 ? 'link' : 'text'} icon={<FilterIcon />}>
          {btnText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start">
        <FilterOverlay filters={filters} onApplyFilters={onApplyFilters} />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default FilterPopover

interface FilterOverlayProps {
  filters: string[]
  onApplyFilters: (filter: Filter[]) => void
}

const FilterOverlay = ({ filters: filtersFromUrl, onApplyFilters }: FilterOverlayProps) => {
  const snap = useTableEditorTableStateSnapshot()

  const initialFilters = useMemo(
    () => formatFilterURLParams((filtersFromUrl as string[]) ?? []),
    [filtersFromUrl]
  )
  const [filters, setFilters] = useState<Filter[]>(initialFilters)

  function onAddFilter() {
    const column = snap.table.columns[0]?.name

    if (column) {
      setFilters([
        ...filters,
        {
          column,
          operator: '=',
          value: '',
        },
      ])
    }
  }

  const onChangeFilter = useCallback((index: number, filter: Filter) => {
    setFilters((currentFilters) =>
      update(currentFilters, {
        [index]: {
          $set: filter,
        },
      })
    )
  }, [])

  const onDeleteFilter = useCallback((index: number) => {
    setFilters((currentFilters) =>
      update(currentFilters, {
        $splice: [[index, 1]],
      })
    )
  }, [])

  const onSelectApplyFilters = () => {
    // [Joshen] Trim empty spaces in input for only UUID type columns
    const formattedFilters = filters.map((f) => {
      const column = snap.table.columns.find((c) => c.name === f.column)
      if (column?.format === 'uuid') return { ...f, value: f.value.trim() }
      else return f
    })
    setFilters(formattedFilters)
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
