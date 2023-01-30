import { FC, useState, useMemo, useCallback } from 'react'
import { isEqual } from 'lodash'
import { Button, IconPlus, IconFilter, Popover } from 'ui'
import update from 'immutability-helper'
import { useUrlState } from 'hooks'

import FilterRow from './FilterRow'
import { useTrackedState } from 'components/grid/store'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { Filter } from 'components/grid/types'
import { FilterOperatorOptions } from './Filter.constants'

const FilterPopover: FC = () => {
  const [{ filter: filters }]: any = useUrlState({ arrayKeys: ['filter'] })
  const btnText =
    (filters || []).length > 0
      ? `Filtered by ${filters.length} rule${filters.length > 1 ? 's' : ''}`
      : 'Filter'

  return (
    <Popover
      size="large"
      align="start"
      className="sb-grid-filter-popover"
      overlay={<FilterOverlay />}
    >
      <Button
        as="span"
        type={(filters || []).length > 0 ? 'link' : 'text'}
        icon={
          <div className="text-scale-1000">
            <IconFilter strokeWidth={1.5} />
          </div>
        }
      >
        {btnText}
      </Button>
    </Popover>
  )
}
export default FilterPopover

const FilterOverlay: FC = () => {
  const state = useTrackedState()

  const [{ filter: filtersFromUrl }, setParams] = useUrlState({ arrayKeys: ['filter'] })
  const initialFilters = useMemo(
    () => formatFilterURLParams((filtersFromUrl as string[]) ?? []),
    [filtersFromUrl]
  )
  const [filters, setFilters] = useState<Filter[]>(initialFilters)

  function onAddFilter() {
    const column = state.table?.columns[0]?.name

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
          />
        ))}
        {filters.length == 0 && (
          <div className="space-y-1 px-3">
            <h5 className="text-sm text-scale-1100">No filters applied to this view</h5>
            <p className="text-xs text-scale-900">Add a column below to filter the view</p>
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
