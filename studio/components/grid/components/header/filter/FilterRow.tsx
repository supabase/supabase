import { memo } from 'react'
import { Button, Input, IconChevronDown, IconX } from 'ui'

import { Filter, FilterOperator, SupaTable } from 'components/grid/types'
import { DropdownControl } from 'components/grid/components/common'
import { FilterOperatorOptions } from './Filter.constants'

export interface FilterRowProps {
  table: SupaTable
  filterIdx: number
  filter: Filter
  onChange: (index: number, filter: Filter) => void
  onDelete: (index: number) => void
}

const FilterRow = ({ table, filter, filterIdx, onChange, onDelete }: FilterRowProps) => {
  const column = table.columns.find((x) => x.name === filter.column)
  const columnOptions =
    table.columns?.map((x) => {
      return { value: x.name, label: x.name, postLabel: x.dataType }
    }) || []

  const placeholder =
    column?.format === 'timestamptz'
      ? 'yyyy-mm-dd hh:mm:ss+zz'
      : column?.format === 'timestamp'
      ? 'yyyy-mm-dd hh:mm:ss'
      : 'Enter a value'

  return (
    <div className="sb-grid-filter-row px-3">
      <DropdownControl
        align="start"
        options={columnOptions}
        onSelect={(nextColumn) => onChange(filterIdx, { ...filter, column: nextColumn as string })}
      >
        <Button
          asChild
          type="outline"
          icon={
            <div className="text-scale-900">
              <IconChevronDown strokeWidth={1.5} size={14} />
            </div>
          }
          className="w-32"
        >
          <span>{column?.name ?? ''}</span>
        </Button>
      </DropdownControl>
      <DropdownControl
        align="start"
        options={FilterOperatorOptions}
        onSelect={(nextOperator) =>
          onChange(filterIdx, {
            ...filter,
            operator: nextOperator as FilterOperator,
          })
        }
      >
        <Button
          asChild
          type="outline"
          icon={
            <div className="text-scale-900">
              <IconChevronDown strokeWidth={1.5} size={14} />
            </div>
          }
        >
          <span>{filter.operator}</span>
        </Button>
      </DropdownControl>
      <Input
        size="tiny"
        className="w-full"
        placeholder={placeholder}
        value={filter.value}
        onChange={(event) =>
          onChange(filterIdx, {
            ...filter,
            value: event.target.value,
          })
        }
      />
      <Button
        icon={<IconX strokeWidth={1.5} size={14} />}
        size="tiny"
        type="text"
        onClick={() => onDelete(filterIdx)}
      />
    </div>
  )
}
export default memo(FilterRow)
