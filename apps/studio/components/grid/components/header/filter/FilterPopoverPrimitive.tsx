import { useDebounce } from '@uidotdev/usehooks'
import { Filter as FilterIcon, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import type { Filter, FilterOperator } from 'components/grid/types'
import useLatest from 'hooks/misc/useLatest'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import FilterRow from './FilterRow'

export interface FilterPopoverPrimitiveProps {
  buttonText?: string
  filters: Filter[]
  onApplyFilters: (filters: Filter[]) => void
  portal?: boolean
}

export const FilterPopoverPrimitive = ({
  buttonText,
  filters,
  onApplyFilters,
  portal = true,
}: FilterPopoverPrimitiveProps) => {
  const [open, setOpen] = useState(false)
  const snap = useTableEditorTableStateSnapshot()

  const [localFilters, setLocalFilters] = useState(filters)

  const debouncedFilters = useDebounce(localFilters, 500)
  const onApplyFiltersRef = useLatest(onApplyFilters)
  useEffect(() => {
    onApplyFiltersRef.current(debouncedFilters)
  }, [debouncedFilters, onApplyFiltersRef])

  const displayButtonText =
    buttonText ??
    (filters.length > 0
      ? `Filtered by ${filters.length} rule${filters.length > 1 ? 's' : ''}`
      : 'Filter')

  const onAddFilter = () => {
    const column = snap.table.columns[0]?.name
    if (column) {
      const newFilters: Filter[] = [
        ...localFilters,
        {
          column,
          operator: '=' as FilterOperator,
          value: '',
        },
      ]
      setLocalFilters(newFilters)
    }
  }

  const onChangeFilter = useCallback(
    (index: number, filter: Filter) => {
      const newFilters: Filter[] = [
        ...localFilters.slice(0, index),
        filter,
        ...localFilters.slice(index + 1),
      ]
      setLocalFilters(newFilters)
    },
    [localFilters, setLocalFilters]
  )

  const onDeleteFilter = useCallback(
    (index: number) => {
      const newFilters: Filter[] = [
        ...localFilters.slice(0, index),
        ...localFilters.slice(index + 1),
      ]
      setLocalFilters(newFilters)
    },
    [localFilters, setLocalFilters]
  )

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={filters.length > 0 ? 'link' : 'text'} icon={<FilterIcon />}>
          {displayButtonText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start" portal={portal}>
        <div className="space-y-2 py-2">
          <div className="space-y-2">
            {localFilters.map((filter, index) => (
              <FilterRow
                key={`filter-${filter.column}-${[index]}`}
                filter={filter}
                filterIdx={index}
                onChange={onChangeFilter}
                onDelete={onDeleteFilter}
              />
            ))}
            {localFilters.length == 0 && (
              <div className="space-y-1 px-3">
                <h5 className="text-sm text-foreground-light">No filters applied to this view</h5>
                <p className="text-xs text-foreground-lighter">
                  Add a column below to filter the view
                </p>
              </div>
            )}
          </div>
          <PopoverSeparator_Shadcn_ />
          <div className="px-3 flex flex-row justify-between">
            <Button icon={<Plus />} type="text" onClick={onAddFilter}>
              Add filter
            </Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
