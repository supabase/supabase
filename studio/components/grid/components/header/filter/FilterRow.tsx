import { debounce } from 'lodash'
import { FC, memo, useState, useEffect, ChangeEvent, useCallback } from 'react'
import { Button, Input, IconChevronDown, IconX } from '@supabase/ui'

import { useUrlState } from 'hooks'
import { Filter } from 'components/grid/types'
import { DropdownControl } from 'components/grid/components/common'
import { useTrackedState } from 'components/grid/store'
import { FilterOperatorOptions } from './Filter.constants'

interface Props {
  filter: Filter
  filterIdx: number
}

// [Area of improvement] Input field loses focus after the debounce (because of useUrlState?)
const FilterRow: FC<Props> = ({ filter, filterIdx }) => {
  const state = useTrackedState()
  const [_, setParams] = useUrlState({ arrayKeys: ['filter'] })

  const column = state.table?.columns.find((x) => x.name === filter.column)
  const columnOptions =
    state.table?.columns?.map((x) => {
      return { value: x.name, label: x.name, postLabel: x.dataType }
    }) || []
  const [filterValue, setFilterValue] = useState(filter.value)

  useEffect(() => {
    setFilterValue(filter.value)
  }, [filterIdx])

  function onRemoveFilter() {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const updatedFilters = existingFilters.filter((filter: string, idx: number) => {
        if (idx !== filterIdx) return filter
      })
      return {
        ...prevParams,
        filter: updatedFilters,
      }
    })
  }

  function onColumnChange(column: string | number) {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const updatedFilters = existingFilters.map((filter: string, idx: number) => {
        if (idx === filterIdx) {
          const [_, operator, ...value] = filter.split(':')
          const formattedValue = value.join(':')
          return `${column}:${operator}:${formattedValue}`
        } else {
          return filter
        }
      })
      return {
        ...prevParams,
        filter: updatedFilters,
      }
    })
  }

  function onOperatorChange(operator: string | number) {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const updatedFilters = existingFilters.map((filter: string, idx: number) => {
        if (idx === filterIdx) {
          const [column, _, ...value] = filter.split(':')
          const formattedValue = value.join(':')
          const selectedOperator = FilterOperatorOptions.find((option) => option.value === operator)
          return `${column}:${selectedOperator?.abbrev}:${formattedValue}`
        } else {
          return filter
        }
      })
      return {
        ...prevParams,
        filter: updatedFilters,
      }
    })
  }

  function onValueChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    setFilterValue(value)
    debounceHandler({
      filterIdx,
      value: { ...filter, value: value },
    })
  }

  const updateFilterValue = (payload: { filterIdx: number; value: Filter }) => {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const updatedFilters = existingFilters.map((filter: string, idx: number) => {
        if (idx === filterIdx) {
          const [column, operator] = filter.split(':')
          return `${column}:${operator}:${payload.value.value}`
        } else {
          return filter
        }
      })
      return {
        ...prevParams,
        filter: updatedFilters,
      }
    })
  }
  const debounceHandler = useCallback(debounce(updateFilterValue, 600), [])

  const placeholder =
    column?.format === 'timestamptz'
      ? 'yyyy-mm-dd hh:mm:ss+zz'
      : column?.format === 'timestamp'
      ? 'yyyy-mm-dd hh:mm:ss'
      : 'Enter a value'

  return (
    <div className="sb-grid-filter-row px-3">
      <DropdownControl align="start" options={columnOptions} onSelect={onColumnChange}>
        <Button
          as="span"
          type="outline"
          icon={
            <div className="text-scale-900">
              <IconChevronDown strokeWidth={1.5} size={14} />
            </div>
          }
          className="w-32"
        >
          {column?.name || ''}
        </Button>
      </DropdownControl>
      <DropdownControl align="start" options={FilterOperatorOptions} onSelect={onOperatorChange}>
        <Button
          as="span"
          type="outline"
          icon={
            <div className="text-scale-900">
              <IconChevronDown strokeWidth={1.5} size={14} />
            </div>
          }
        >
          {filter.operator}
        </Button>
      </DropdownControl>
      <Input
        size="tiny"
        className="w-full"
        placeholder={placeholder}
        value={filterValue}
        onChange={onValueChange}
      />
      <Button
        icon={<IconX strokeWidth={1.5} size={14} />}
        size="tiny"
        type="text"
        onClick={onRemoveFilter}
      />
    </div>
  )
}
export default memo(FilterRow)
