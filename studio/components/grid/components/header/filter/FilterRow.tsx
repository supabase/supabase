import { FC, memo } from 'react'
import { Button, Input, IconChevronDown, IconX } from 'ui'

import { Filter, FilterOperator } from 'components/grid/types'
import { DropdownControl } from 'components/grid/components/common'
import { useTrackedState } from 'components/grid/store'
import { FilterOperatorOptions } from './Filter.constants'

interface Props {
  filterIdx: number
  filter: Filter
  onChange: (index: number, filter: Filter) => void
  onDelete: (index: number) => void
}

const FilterRow: FC<Props> = ({ filter, filterIdx, onChange, onDelete }) => {
  const state = useTrackedState()

  const column = state.table?.columns.find((x) => x.name === filter.column)
  const columnOptions =
    state.table?.columns?.map((x) => {
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
          as="span"
          type="outline"
          icon={
            <div className="text-scale-900">
              <IconChevronDown strokeWidth={1.5} size={14} />
            </div>
          }
          className="w-32"
        >
          {column?.name ?? ''}
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
