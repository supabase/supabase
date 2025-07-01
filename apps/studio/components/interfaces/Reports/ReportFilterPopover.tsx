import { ChevronDown, Filter as FilterIcon, Plus, X } from 'lucide-react'
import { KeyboardEvent, useCallback, useState, useMemo } from 'react'
import { isEqual } from 'lodash'

import { DropdownControl } from 'components/grid/components/common/DropdownControl'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Input,
} from 'ui'
import type { ReportFilter, ReportFilterProperty } from './Reports.types'

export interface ReportFilterPopoverProps {
  buttonText?: string
  filters: ReportFilter[]
  filterProperties: ReportFilterProperty[]
  onFiltersChange: (filters: ReportFilter[]) => void
  portal?: boolean
  disabled?: boolean
}

const ReportFilterRow = ({
  filter,
  filterIdx,
  filterProperties,
  onChange,
  onDelete,
  onKeyDown,
}: {
  filter: ReportFilter
  filterIdx: number
  filterProperties: ReportFilterProperty[]
  onChange: (index: number, filter: ReportFilter) => void
  onDelete: (index: number) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}) => {
  const property = filterProperties.find((p) => p.name === filter.propertyName)

  const propertyOptions = filterProperties.map((prop) => ({
    value: prop.name,
    label: prop.label,
    postLabel: prop.type,
  }))

  const operatorOptions =
    property?.operators.map((op) => ({
      value: op,
      label: op,
    })) || []

  const valueOptions = property?.options || []

  const handlePropertyChange = (newPropertyName: string | number) => {
    const newProperty = filterProperties.find((p) => p.name === newPropertyName)
    if (newProperty) {
      onChange(filterIdx, {
        propertyName: newPropertyName,
        operator: newProperty.operators[0] || '=',
        value: '',
      })
    }
  }

  const handleOperatorChange = (newOperator: string | number) => {
    onChange(filterIdx, {
      ...filter,
      operator: newOperator,
    })
  }

  const handleValueChange = (value: string | number) => {
    const convertedValue =
      property?.type === 'number' ? (isNaN(Number(value)) ? value : Number(value)) : value

    onChange(filterIdx, {
      ...filter,
      value: convertedValue,
    })
  }

  return (
    <div className="flex w-full items-center justify-between gap-x-2 px-3">
      <DropdownControl align="start" options={propertyOptions} onSelect={handlePropertyChange}>
        <Button
          asChild
          type="outline"
          icon={
            <div className="text-foreground-lighter">
              <ChevronDown strokeWidth={1.5} />
            </div>
          }
          className="w-32 justify-start"
        >
          <span>{property?.label ?? 'Select property'}</span>
        </Button>
      </DropdownControl>

      <DropdownControl align="start" options={operatorOptions} onSelect={handleOperatorChange}>
        <Button
          asChild
          type="outline"
          icon={
            <div className="text-foreground-lighter">
              <ChevronDown strokeWidth={1.5} />
            </div>
          }
          className="w-20 justify-start"
        >
          <span>{filter.operator}</span>
        </Button>
      </DropdownControl>

      {valueOptions.length > 0 ? (
        <DropdownControl
          align="start"
          className="flex-1"
          options={valueOptions}
          onSelect={(value) => handleValueChange(value)}
        >
          <Button
            asChild
            type="outline"
            icon={
              <div className="text-foreground-lighter w-full">
                <ChevronDown strokeWidth={1.5} />
              </div>
            }
            className="w-full flex-1 justify-start"
          >
            <span>{filter.value || 'Select value'}</span>
          </Button>
        </DropdownControl>
      ) : (
        <Input
          size="tiny"
          className="flex-1"
          placeholder={
            property?.placeholder || `Enter ${property?.type === 'number' ? 'number' : 'text'}`
          }
          value={filter.value}
          type={property?.type === 'number' ? 'number' : 'text'}
          onChange={(event) => handleValueChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
      )}

      <Button
        type="text"
        size="tiny"
        className="px-1"
        icon={<X strokeWidth={1.5} />}
        onClick={() => onDelete(filterIdx)}
      />
    </div>
  )
}

export const ReportFilterPopover = ({
  buttonText,
  filters,
  filterProperties,
  onFiltersChange,
  portal = true,
  disabled = false,
}: ReportFilterPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<ReportFilter[]>(filters)

  // Update local state when filters prop changes
  useMemo(() => {
    setLocalFilters(filters)
  }, [filters])

  const displayButtonText =
    buttonText ??
    (filters.length > 0
      ? `Filtered by ${filters.length} rule${filters.length > 1 ? 's' : ''}`
      : 'Filter')

  const onAddFilter = () => {
    const firstProperty = filterProperties[0]
    if (firstProperty) {
      setLocalFilters([
        ...localFilters,
        {
          propertyName: firstProperty.name,
          operator: firstProperty.operators[0] || '=',
          value: '',
        },
      ])
    }
  }

  const onChangeFilter = useCallback((index: number, filter: ReportFilter) => {
    setLocalFilters((currentFilters) => [
      ...currentFilters.slice(0, index),
      filter,
      ...currentFilters.slice(index + 1),
    ])
  }, [])

  const onDeleteFilter = useCallback((index: number) => {
    setLocalFilters((currentFilters) => [
      ...currentFilters.slice(0, index),
      ...currentFilters.slice(index + 1),
    ])
  }, [])

  const onApplyFilters = () => {
    // Filter out empty values
    const validFilters = localFilters.filter(
      (f) => f.value !== null && f.value !== undefined && f.value !== ''
    )
    onFiltersChange(validFilters)
    setOpen(false)
  }

  const onResetFilters = () => {
    setLocalFilters([])
    onFiltersChange([])
    setOpen(false)
  }

  function handleEnterKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') onApplyFilters()
  }

  const hasChanges = !isEqual(localFilters, filters)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type={filters.length > 0 ? 'link' : 'text'}
          icon={<FilterIcon />}
          disabled={disabled}
        >
          {displayButtonText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-[500px]" side="bottom" align="start" portal={portal}>
        <div className="space-y-2 py-2">
          <div className="space-y-2">
            {localFilters.map((filter, index) => (
              <ReportFilterRow
                key={`filter-${filter.propertyName}-${index}`}
                filter={filter}
                filterIdx={index}
                filterProperties={filterProperties}
                onChange={onChangeFilter}
                onDelete={onDeleteFilter}
                onKeyDown={handleEnterKeyDown}
              />
            ))}
            {localFilters.length === 0 && (
              <div className="space-y-1 px-3">
                <h5 className="text-sm text-foreground-light">No filters applied</h5>
                <p className="text-xs text-foreground-lighter">
                  Add a filter below to narrow down the report data
                </p>
              </div>
            )}
          </div>
          <PopoverSeparator_Shadcn_ />
          <div className="px-3 flex flex-row justify-between">
            <div className="flex gap-2">
              <Button icon={<Plus />} type="text" onClick={onAddFilter}>
                Add filter
              </Button>
              {filters.length > 0 && (
                <Button type="text" onClick={onResetFilters}>
                  Clear all
                </Button>
              )}
            </div>
            <Button disabled={!hasChanges} type="default" onClick={onApplyFilters}>
              Apply filters
            </Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
