import RuleSetButtonText from 'components/grid/components/header/RulesSetButtonText'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import type { Filter, SupaTable } from 'components/grid/types'
import { useUrlState } from 'hooks/ui/useUrlState'
import update from 'immutability-helper'
import { isEqual } from 'lodash'
import { Plus, PlusCircle } from 'lucide-react'
import { KeyboardEvent, useCallback, useMemo, useState } from 'react'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'
import { FilterOperatorOptions } from './Filter.constants'
import FilterRow from './FilterRow'

export interface FilterPopoverProps {
  table: SupaTable
  filters: string[]
  setParams: ReturnType<typeof useUrlState>[1]
}

const FilterPopover = ({ table, filters, setParams }: FilterPopoverProps) => {
  const [open, setOpen] = useState(false)
  const snap = useTableEditorStateSnapshot()

  const onApplyFilters = (appliedFilters: Filter[]) => {
    snap.setEnforceExactCount(false)
    setParams((prevParams) => {
      return {
        ...prevParams,
        filter: appliedFilters.map((filter) => {
          const selectedOperator = FilterOperatorOptions.find(
            (option) => option.value === filter.operator
          )

          return `${filter.column}:${selectedOperator?.abbrev}:${filter.value}`
        }),
      }
    })
  }

  const hasFilters = (filters || []).length > 0

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type={hasFilters ? 'default' : 'dashed'}
          icon={!hasFilters && <PlusCircle strokeWidth={1.5} />}
          className={cn('rounded-full', hasFilters && filters.length <= 2 && 'pr-0.5')}
        >
          <RuleSetButtonText
            rules={filters}
            type="filter"
            renderRule={(filter) => {
              const [column, operator, value] = filter.split(':')
              return { column, operator, value }
            }}
          />
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start">
        <FilterOverlay table={table} filters={filters} onApplyFilters={onApplyFilters} />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default FilterPopover

interface FilterOverlayProps {
  table: SupaTable
  filters: string[]
  onApplyFilters: (filter: Filter[]) => void
}

const FilterOverlay = ({ table, filters: filtersFromUrl, onApplyFilters }: FilterOverlayProps) => {
  const initialFilters = useMemo(
    () => formatFilterURLParams((filtersFromUrl as string[]) ?? []),
    [filtersFromUrl]
  )
  const [filters, setFilters] = useState<Filter[]>(initialFilters)

  function onAddFilter() {
    const column = table.columns[0]?.name

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
      const column = table.columns.find((c) => c.name === f.column)
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
            table={table}
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
