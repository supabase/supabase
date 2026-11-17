import { format } from 'date-fns'
import { Loader2Icon } from 'lucide-react'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Button, Calendar } from 'ui'
import {
  CustomOptionProps,
  FilterBar,
  FilterBarHandle,
  FilterGroup,
  FilterProperty,
  isGroup,
} from 'ui-patterns/FilterBar'

import { columnToFilterProperty } from './FilterPopoverNew.utils'
import { useTableFilter } from '@/components/grid/hooks/useTableFilter'
import type { Filter } from '@/components/grid/types'
import { useFilterBarAiAction } from '@/hooks/misc/useFilterBarAiAction'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export interface FilterPopoverProps {
  isRefetching?: boolean
  onInputFocus?: () => void
  onInputBlur?: () => void
}

// Convert Filter[] to FilterGroup
// Note: pg-meta Filter allows column to be string | string[] (for tuple filters)
// We only support simple string columns in the FilterBar
function filtersToFilterGroup(filters: Filter[]): FilterGroup {
  return {
    logicalOperator: 'AND',
    conditions: filters
      .filter((filter) => typeof filter.column === 'string') // Skip tuple filters
      .map((filter) => ({
        propertyName: filter.column as string,
        operator: filter.operator,
        value: filter.value,
      })),
  }
}

// Convert FilterGroup to Filter[]
function filterGroupToFilters(group: FilterGroup): Filter[] {
  const filters: Filter[] = []
  for (const condition of group.conditions) {
    if (isGroup(condition)) {
      filters.push(...filterGroupToFilters(condition))
    } else {
      filters.push({
        column: condition.propertyName,
        operator: condition.operator as Filter['operator'],
        value: String(condition.value ?? ''),
      })
    }
  }
  return filters
}

// Custom date picker component for the FilterBar
function DatePickerOption({ onChange, onCancel, search }: CustomOptionProps) {
  const parsed = search ? new Date(search) : undefined
  const [date, setDate] = useState<Date | undefined>(
    parsed && !isNaN(parsed.getTime()) ? parsed : undefined
  )

  return (
    <div className="w-[300px] space-y-4">
      <Calendar
        autoFocus
        mode="single"
        defaultMonth={date}
        selected={date}
        onSelect={setDate}
        className="w-full"
      />
      <div className="flex justify-end gap-2 py-3 px-4 border-t">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={() => onChange(date ? format(date, 'yyyy-MM-dd') : '')}>
          Apply
        </Button>
      </div>
    </div>
  )
}

export const FilterPopoverNew = ({
  isRefetching = false,
  onInputFocus,
  onInputBlur,
}: FilterPopoverProps) => {
  const { filters, setFilters } = useTableFilter()
  const snap = useTableEditorTableStateSnapshot()
  const filterBarRef = useRef<FilterBarHandle>(null)

  const [freeformText, setFreeformText] = useState('')

  // Local state for the FilterBar — committed to the table state on apply only,
  // so transient edits don't fire data requests.
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(() => filtersToFilterGroup(filters))

  const syncFromFilters = useEffectEvent(() => {
    setFilterGroup(filtersToFilterGroup(filters))
  })

  useEffect(() => {
    syncFromFilters()
  }, [filters])

  const columns = useMemo(() => snap.table?.columns ?? [], [snap.table?.columns])

  // Create filter properties from table columns
  // Add the date picker component for date columns (can't be in utils due to React component)
  const filterProperties: FilterProperty[] = useMemo(() => {
    return columns.map((column) => {
      const property = columnToFilterProperty(column)
      if (property.type === 'date' && Array.isArray(property.options)) {
        return {
          ...property,
          options: [
            ...property.options,
            {
              label: 'Pick a date...',
              component: (props: CustomOptionProps) => <DatePickerOption {...props} />,
            },
          ],
        }
      }
      return property
    })
  }, [columns])

  // Transient edits stay local — onApply pushes to the table state.
  const handleFilterChange = useCallback((newFilterGroup: FilterGroup) => {
    setFilterGroup((prev) => {
      if (newFilterGroup.conditions.length < prev.conditions.length) {
        setTimeout(() => filterBarRef.current?.focus(), 0)
      }
      return newFilterGroup
    })
  }, [])

  const handleApply = useCallback(
    (newFilterGroup: FilterGroup) => {
      const isValid = newFilterGroup.conditions.every(
        (condition) =>
          isGroup(condition) ||
          (!!condition.propertyName &&
            !!condition.operator &&
            condition.value !== '' &&
            condition.value != null)
      )
      if (!isValid) return
      setFilters(filterGroupToFilters(newFilterGroup))
    },
    [setFilters]
  )

  const { actions, isGenerating } = useFilterBarAiAction({
    filterProperties,
    // Generated filters are complete, so apply them now rather than waiting for a blur.
    onGenerate: (generated) => {
      handleFilterChange(generated)
      handleApply(generated)
      setFreeformText('')
    },
  })

  // Generating filters and fetching rows read as one wait, so both show the same spinner.
  const isLoading = isGenerating || isRefetching
  const icon = isLoading ? (
    <Loader2Icon
      className="animate-spin text-primary h-4 w-4 shrink-0"
      aria-label="Loading table data"
    />
  ) : null

  return (
    <div className="flex-1 min-w-0" onFocus={() => onInputFocus?.()} onBlur={() => onInputBlur?.()}>
      <FilterBar
        ref={filterBarRef}
        filterProperties={filterProperties}
        filters={filterGroup}
        onFilterChange={handleFilterChange}
        onApply={handleApply}
        freeformText={freeformText}
        onFreeformTextChange={setFreeformText}
        actions={actions}
        variant="pill"
        className="bg-transparent border-0 overflow-visible px-1.5 [&>div>div>div>input]:!text-xs"
        icon={icon}
      />
    </div>
  )
}
