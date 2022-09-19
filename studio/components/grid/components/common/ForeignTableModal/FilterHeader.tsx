import React, { FC, useState } from 'react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { Button, Input, IconChevronDown, IconSearch } from 'ui'
import { DropdownControl } from '../../common'
import { FilterOperatorOptions } from '../../header/filter'
import { Filter, FilterOperator } from '../../../types'

interface FilterProps {
  defaultColumnName?: string
  defaultValue?: string
  foreignColumnNames: string[]
  onChange: (value: Filter) => void
}

export const FilterHeader: FC<FilterProps> = ({
  defaultColumnName,
  defaultValue,
  foreignColumnNames,
  onChange,
}) => {
  const [columnName, setColumnName] = useState(
    defaultColumnName
      ? defaultColumnName
      : foreignColumnNames.length > 0
      ? foreignColumnNames[0]
      : ''
  )
  const [condition, setCondition] = useState(FilterOperatorOptions[0].value)
  const [filterText, setFilterText] = useState(defaultValue ?? '')

  const columnOptions =
    foreignColumnNames.map((x) => {
      return { value: x, label: x }
    }) || []

  function triggerOnChange(columnName: string, condition: string, filterText: string) {
    onFilterChangeDebounced(
      {
        column: columnName,
        operator: condition as FilterOperator,
        value: filterText,
      },
      onChange
    )
  }

  function onColumnChange(value: string | number) {
    const str = value + ''
    setColumnName(str)
    triggerOnChange(str, condition, filterText)
  }

  function onConditionChange(value: string | number) {
    const str = value + ''
    setCondition(str)
    triggerOnChange(columnName, str, filterText)
  }

  function onFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    setFilterText(value)
    triggerOnChange(columnName, condition, value)
  }

  return (
    <div className="foreign-table-modal__filter">
      <DropdownControl
        side="bottom"
        align="start"
        options={columnOptions}
        onSelect={onColumnChange}
      >
        <Button as="span" type="outline" iconRight={<IconChevronDown />}>
          <span className="foreign-table-modal__filter__trigger-content">
            <span className="foreign-table-modal__filter__trigger-content__label">Column</span>
            <span className="foreign-table-modal__filter__trigger-content__name">{columnName}</span>
          </span>
        </Button>
      </DropdownControl>
      <DropdownControl
        side="bottom"
        align="start"
        options={FilterOperatorOptions}
        onSelect={onConditionChange}
      >
        <Button as="span" type="outline" iconRight={<IconChevronDown />}>
          <span className="foreign-table-modal__filter__trigger-content">
            <span className="foreign-table-modal__filter__trigger-content__label">Filter</span>
            <span className="foreign-table-modal__filter__trigger-content__name">{condition}</span>
          </span>
        </Button>
      </DropdownControl>
      <Input
        size="tiny"
        className="foreign-table-modal__filter__search-input"
        placeholder="Find a record"
        value={filterText}
        onChange={onFilterChange}
        icon={<IconSearch size="small" />}
      />
    </div>
  )
}

const onFilterChangeDebounced = AwesomeDebouncePromise(
  (filter: Filter, onChange: (value: Filter) => void) => {
    onChange(filter)
  },
  500
)
