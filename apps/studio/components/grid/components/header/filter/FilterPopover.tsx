import { isEqual } from 'lodash'
import { Filter as FilterIcon, Plus } from 'lucide-react'
import { KeyboardEvent, useCallback, useMemo, useState } from 'react'

import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { Filter } from 'components/grid/types'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import FilterRow from './FilterRow'

export interface FilterPopoverProps {
  portal?: boolean
}

const FilterPopover = ({ portal = true }: FilterPopoverProps) => {
  const [open, setOpen] = useState(false)
  const { urlFilters } = useTableFilter()

  const btnText =
    (urlFilters || []).length > 0
      ? `Filtered by ${urlFilters.length} rule${urlFilters.length > 1 ? 's' : ''}`
      : 'Filter'

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={(urlFilters || []).length > 0 ? 'link' : 'text'} icon={<FilterIcon />}>
          {btnText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start" portal={portal}>
        <FilterOverlay />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default FilterPopover

interface FilterOverlayProps {}

const FilterOverlay = ({}: FilterOverlayProps) => {
  const snap = useTableEditorTableStateSnapshot()
  const { urlFilters, onApplyFilters } = useTableFilter()

  const initialFilters = useMemo(() => formatFilterURLParams(urlFilters ?? []), [urlFilters])
  const [filters, setFilters] = useState<Filter[]>(initialFilters)

  useMemo(() => {
    setFilters(initialFilters)
  }, [initialFilters])

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
    setFilters((currentFilters) => [
      ...currentFilters.slice(0, index),
      filter,
      ...currentFilters.slice(index + 1),
    ])
  }, [])

  const onDeleteFilter = useCallback((index: number) => {
    setFilters((currentFilters) => [
      ...currentFilters.slice(0, index),
      ...currentFilters.slice(index + 1),
    ])
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
