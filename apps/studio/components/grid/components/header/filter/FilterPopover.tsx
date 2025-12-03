import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

import { useDebounce } from '@uidotdev/usehooks'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import type { Filter, SupaColumn } from 'components/grid/types'
import {
  isBoolColumn,
  isDateColumn,
  isDateTimeColumn,
  isEnumColumn,
  isTimeColumn,
} from 'components/grid/utils/types'
import { useSqlFilterGenerateMutation } from 'data/ai/sql-filter-mutation'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, Calendar } from 'ui'
import {
  CustomOptionProps,
  FilterBar,
  FilterGroup,
  FilterProperty,
  isGroup,
  SerializableFilterProperty,
  updateGroupAtPath,
} from 'ui-patterns'
import { FilterOperatorOptions } from './Filter.constants'

export interface FilterPopoverProps {
  portal?: boolean
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
  const [date, setDate] = useState<Date | undefined>(search ? new Date(search) : undefined)

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
        <Button type="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" onClick={() => onChange(date ? format(date, 'yyyy-MM-dd') : '')}>
          Apply
        </Button>
      </div>
    </div>
  )
}

// Check if column is a date/datetime/time type
function isDateLikeColumn(column: SupaColumn): boolean {
  return (
    isDateColumn(column.format) || isDateTimeColumn(column.format) || isTimeColumn(column.format)
  )
}

function serializeFilterProperties(
  filterProperties: FilterProperty[]
): SerializableFilterProperty[] {
  return filterProperties.map((property) => ({
    label: property.label,
    name: property.name,
    type: property.type,
    operators: property.operators,
    options: Array.isArray(property.options)
      ? property.options
          .map((option) => {
            if (typeof option === 'string') return option
            const hasValue = typeof (option as any)?.value === 'string'
            const hasLabel = typeof (option as any)?.label === 'string'
            if (hasValue && hasLabel) return (option as any).value || (option as any).label
            if (hasLabel) return (option as any).label
            return null
          })
          .filter((value): value is string => Boolean(value))
      : undefined,
  }))
}

export const FilterPopover = ({ portal = true }: FilterPopoverProps) => {
  const { filters: urlFilters, onApplyFilters } = useTableFilter()
  const snap = useTableEditorTableStateSnapshot()

  // Local state for immediate UI updates
  const [localFilters, setLocalFilters] = useState<Filter[]>(urlFilters)
  const debouncedLocalFilters = useDebounce(localFilters, 500)

  useEffect(() => {
    onApplyFilters(debouncedLocalFilters)
  }, [debouncedLocalFilters])

  const [freeformText, setFreeformText] = useState('')
  const { mutateAsync: generateFilters, isLoading: isGenerating } = useSqlFilterGenerateMutation()

  // Convert filters to FilterGroup for the FilterBar
  const filterGroup = useMemo(() => filtersToFilterGroup(localFilters), [localFilters])

  // Create filter properties from table columns
  const filterProperties: FilterProperty[] = useMemo(() => {
    const columns = snap.table?.columns ?? []
    const defaultOperators = FilterOperatorOptions.map((op) => op.value)
    const stringOperators = ['~~*', ...defaultOperators.filter((op) => op !== '~~*')]

    return columns.map((column) => {
      // For enum columns, use the enum values as options
      if (isEnumColumn(column.dataType) && column.enum) {
        return {
          label: column.name,
          name: column.name,
          type: 'string' as const,
          options: column.enum.map((value) => ({ label: value, value })),
          operators: FilterOperatorOptions.map((op) => op.value),
        }
      }

      // For boolean columns
      if (isBoolColumn(column.dataType)) {
        return {
          label: column.name,
          name: column.name,
          type: 'boolean' as const,
          options: [
            { label: 'true', value: 'true' },
            { label: 'false', value: 'false' },
          ],
          operators: ['=', '<>'],
        }
      }

      // For date/datetime columns, add date picker option
      if (isDateLikeColumn(column)) {
        const today = new Date()
        const yesterday = new Date(Date.now() - 86400000)
        const lastWeek = new Date(Date.now() - 7 * 86400000)
        const lastMonth = new Date(Date.now() - 30 * 86400000)

        // Put '>' first so it's the default operator for dates
        const dateOperators = ['>', '>=', '<', '<=', '=', '<>']

        return {
          label: column.name,
          name: column.name,
          type: 'date' as const,
          options: [
            { label: 'Today', value: format(today, 'yyyy-MM-dd') },
            { label: 'Yesterday', value: format(yesterday, 'yyyy-MM-dd') },
            { label: 'Last 7 days', value: format(lastWeek, 'yyyy-MM-dd') },
            { label: 'Last 30 days', value: format(lastMonth, 'yyyy-MM-dd') },
            {
              label: 'Pick a date...',
              component: (props: CustomOptionProps) => <DatePickerOption {...props} />,
            },
          ],
          operators: dateOperators,
        }
      }

      // For other columns, keep a simple text-based filter
      return {
        label: column.name,
        name: column.name,
        type: 'string' as const,
        operators: stringOperators,
      }
    })
  }, [snap.table?.columns])

  const serializableFilterProperties = useMemo(
    () => serializeFilterProperties(filterProperties),
    [filterProperties]
  )

  // Handle filter changes from FilterBar
  const handleFilterChange = (newFilterGroup: FilterGroup) => {
    const newFilters = filterGroupToFilters(newFilterGroup)
    // Update local state immediately for responsive UI
    setLocalFilters(newFilters)
  }

  const actions = useMemo(
    () => [
      {
        value: 'ai-filter',
        label: 'Filter by AI',
        onSelect: async (
          inputValue: string,
          context: { path: number[]; activeFilters: FilterGroup }
        ) => {
          const prompt = inputValue.trim()
          if (!prompt) return

          const aiGroup = await generateFilters({
            prompt,
            filterProperties: serializableFilterProperties,
            currentPath: context.path ?? [],
          })

          const updatedGroup = updateGroupAtPath(context.activeFilters, context.path ?? [], aiGroup)
          handleFilterChange(updatedGroup)
          setFreeformText('')
        },
      },
    ],
    [generateFilters, serializableFilterProperties]
  )

  return (
    <FilterBar
      filterProperties={filterProperties}
      filters={filterGroup}
      onFilterChange={handleFilterChange}
      freeformText={freeformText}
      onFreeformTextChange={setFreeformText}
      actions={actions}
      isLoading={isGenerating}
      className="bg-transparent border-0"
    />
  )
}
