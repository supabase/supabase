import { useUrlState } from 'hooks'
import update from 'immutability-helper'
import { isEqual } from 'lodash'
import { KeyboardEvent, useCallback, useMemo, useState } from 'react'
import { Button, IconFilter, IconPlus, Popover } from 'ui'

import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { Filter, SupaTable } from 'components/grid/types'
import { FilterOperatorOptions } from './Filter.constants'
import FilterRow from './FilterRow'

export interface FilterPopoverProps {
  table: SupaTable
  filters: string[]
  setParams: ReturnType<typeof useUrlState>[1]
}

const FilterPopover = ({ table, filters, setParams }: FilterPopoverProps) => {
  const btnText =
    (filters || []).length > 0
      ? `Filtered by ${filters.length} rule${filters.length > 1 ? 's' : ''}`
      : 'Filter'

  return (
    <Popover
      size="large"
      align="start"
      className="sb-grid-filter-popover"
      overlay={<FilterOverlay table={table} filters={filters} setParams={setParams} />}
    >
      <Button
        asChild
        type={(filters || []).length > 0 ? 'link' : 'text'}
        icon={
          <div className="text-foreground-light">
            <IconFilter strokeWidth={1.5} />
          </div>
        }
      >
        <span>{btnText}</span>
      </Button>
    </Popover>
  )
}

export default FilterPopover

export interface FilterOverlayProps extends FilterPopoverProps {}

const FilterOverlay = ({ table, filters: filtersFromUrl, setParams }: FilterOverlayProps) => {
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

  function onApplyFilter() {
    setParams((prevParams) => {
      return {
        ...prevParams,
        filter: filters.map((filter) => {
          const selectedOperator = FilterOperatorOptions.find(
            (option) => option.value === filter.operator
          )

          return `${filter.column}:${selectedOperator?.abbrev}:${filter.value}`
        }),
      }
    })
  }

  function handleEnterKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      onApplyFilter()
    }
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
      <Popover.Separator />
      <div className="px-3 flex flex-row justify-between">
        <Button icon={<IconPlus />} type="text" onClick={onAddFilter}>
          Add filter
        </Button>
        <Button disabled={isEqual(filters, initialFilters)} type="default" onClick={onApplyFilter}>
          Apply filter
        </Button>
      </div>
    </div>
  )
}
