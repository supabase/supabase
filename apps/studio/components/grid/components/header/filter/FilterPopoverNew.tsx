import { useTableFilterNew } from 'components/grid/hooks/useTableFilterNew'
import type { Filter } from 'components/grid/types'
import { useSqlFilterGenerateMutation } from 'data/ai/sql-filter-mutation'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, Calendar } from 'ui'
import {
  CustomOptionProps,
  FilterBar,
  FilterGroup,
  FilterOption,
  FilterProperty,
  SerializableFilterProperty,
  isGroup,
  updateGroupAtPath,
} from 'ui-patterns'

import { columnToFilterProperty } from './FilterPopoverNew.utils'

export interface FilterPopoverProps {
  portal?: boolean
  isRefetching?: boolean
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

type OptionLike = FilterOption | null | undefined

const isOptionRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toOptionText = (option: OptionLike): string | null => {
  if (typeof option === 'string') return option
  if (!isOptionRecord(option)) return null

  const value = 'value' in option ? option.value : undefined
  const label = 'label' in option ? option.label : undefined
  const hasValue = typeof value === 'string'
  const hasLabel = typeof label === 'string'

  if (hasValue && hasLabel) return value || label
  if (hasLabel) return label
  return null
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
      ? property.options.map(toOptionText).filter((value): value is string => Boolean(value))
      : undefined,
  }))
}

export const FilterPopoverNew = ({ isRefetching = false }: FilterPopoverProps) => {
  const { filters, setFilters } = useTableFilterNew()
  const snap = useTableEditorTableStateSnapshot()

  const [freeformText, setFreeformText] = useState('')
  const { mutateAsync: generateFilters, isPending: isGenerating } = useSqlFilterGenerateMutation()

  // Convert filters to FilterGroup for the FilterBar
  const filterGroup = useMemo(() => filtersToFilterGroup(filters), [filters])

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

  const serializableFilterProperties = useMemo(
    () => serializeFilterProperties(filterProperties),
    [filterProperties]
  )

  // Handle filter changes from FilterBar
  const handleFilterChange = useCallback(
    (newFilterGroup: FilterGroup) => {
      const newFilters = filterGroupToFilters(newFilterGroup)
      setFilters(newFilters)
    },
    [setFilters]
  )

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
    [generateFilters, serializableFilterProperties, handleFilterChange, setFreeformText]
  )

  const icon = isRefetching ? (
    <Loader2 className="animate-spin text-brand h-4 w-4 shrink-0" aria-label="Loading table data" />
  ) : null

  return (
    <div className="flex-1 min-w-0">
      <FilterBar
        filterProperties={filterProperties}
        filters={filterGroup}
        onFilterChange={handleFilterChange}
        freeformText={freeformText}
        onFreeformTextChange={setFreeformText}
        actions={actions}
        isLoading={isGenerating}
        variant="pill"
        className="bg-transparent border-0"
        icon={icon}
      />
    </div>
  )
}
