import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { AiIconAnimation, Button, Calendar } from 'ui'
import {
  CustomOptionProps,
  FilterBar,
  FilterBarHandle,
  FilterGroup,
  FilterOption,
  FilterProperty,
  isGroup,
  SerializableFilterProperty,
  updateGroupAtPath,
} from 'ui-patterns'

import { columnToFilterProperty } from './FilterPopoverNew.utils'
import { useTableFilter } from '@/components/grid/hooks/useTableFilter'
import type { Filter } from '@/components/grid/types'
import { useSqlFilterGenerateMutation } from '@/data/ai/sql-filter-mutation'
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
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onChange(date ? format(date, 'yyyy-MM-dd') : '')}>
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

export const FilterPopoverNew = ({
  isRefetching = false,
  onInputFocus,
  onInputBlur,
}: FilterPopoverProps) => {
  const { filters, setFilters } = useTableFilter()
  const snap = useTableEditorTableStateSnapshot()
  const filterBarRef = useRef<FilterBarHandle>(null)

  const [freeformText, setFreeformText] = useState('')
  const { mutateAsync: generateFilters, isPending: isGenerating } = useSqlFilterGenerateMutation()

  // Local state for the FilterBar — committed to the table state on apply only,
  // so transient edits don't fire data requests.
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(() => filtersToFilterGroup(filters))

  const syncFromFilters = useEffectEvent(() => {
    setFilterGroup(filtersToFilterGroup(filters))
  })

  useEffect(() => {
    syncFromFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
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

  const serializableFilterProperties = useMemo(
    () => serializeFilterProperties(filterProperties),
    [filterProperties]
  )

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

  const icon = isGenerating ? (
    <AiIconAnimation size={16} loading />
  ) : isRefetching ? (
    <Loader2 className="animate-spin text-brand h-4 w-4 shrink-0" aria-label="Loading table data" />
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
        isLoading={isGenerating}
        variant="pill"
        className="bg-transparent border-0 overflow-visible px-1.5 [&>div>div>div>input]:!text-xs"
        icon={icon}
      />
    </div>
  )
}
