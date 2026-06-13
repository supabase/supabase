import { LoaderCircle, Search } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  FilterBar,
  FilterCondition,
  type FilterBarHandle,
  type FilterGroup,
  type FilterProperty,
} from 'ui-patterns'

import {
  isLogsFilterColumnValue,
  type LogsColumnFilterValue,
  type LogsFilterOperator,
} from '../UnifiedLogs.filters'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const buildFilterGroup = (
  columnFilters: { id: string; value: unknown }[],
  filterableNames: Set<string>
): FilterGroup => {
  const conditions: FilterCondition[] = []
  for (const { id, value } of columnFilters) {
    if (!filterableNames.has(id) || value === null || value === undefined) continue
    // Equality filters carry their operator inside a wrapped value; range/slider
    // filters arrive as plain arrays and default to `=`.
    const { operator, values } = isLogsFilterColumnValue(value)
      ? value
      : { operator: '=' as LogsFilterOperator, values: Array.isArray(value) ? value : [value] }
    for (const v of values) {
      conditions.push({
        propertyName: id,
        value: v as FilterCondition['value'],
        operator,
      })
    }
  }
  return { logicalOperator: 'AND', conditions }
}

export const LogsFilterBar = () => {
  const { table, filterFields, columnFilters, isFetching } = useDataTable()

  const filterBarRef = useRef<FilterBarHandle>(null)
  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_FOCUS_FILTER, () => filterBarRef.current?.focus(), {
    registerInCommandMenu: true,
  })

  const [freeformText, setFreeformText] = useState('')

  const filterProperties: FilterProperty[] = filterFields
    .filter((x) => x.type !== 'timerange')
    .map((filter) => ({
      label: filter.label,
      name: filter.value,
      type: 'string',
      options: filter.options ?? [],
      operators:
        filter.value === 'event_message'
          ? [
              { label: 'iLike', value: '~~*', group: 'pattern' },
              { label: 'Not iLike', value: '!~~*', group: 'pattern' },
            ]
          : [
              { label: 'Equals', value: '=', group: 'comparison' },
              { label: 'Not equal', value: '<>', group: 'comparison' },
            ],
    }))

  // Local state because the FilterBar carries transient states
  const [filters, setFilters] = useState<FilterGroup>(() =>
    buildFilterGroup(columnFilters, new Set(filterProperties.map((p) => p.name)))
  )

  // Read latest filterProperties without making the effect depend on its (per-render) identity.
  const syncFromColumnFilters = useEffectEvent(() => {
    setFilters(buildFilterGroup(columnFilters, new Set(filterProperties.map((p) => p.name))))
  })

  // No nested conditions in unified logs — type-cast to FilterCondition on read.
  const onApply = (next: FilterGroup) => {
    const isValid = next.conditions.every(
      (x) =>
        !!(x as FilterCondition).operator &&
        !!(x as FilterCondition).value &&
        !!(x as FilterCondition).propertyName
    )
    if (!isValid) return

    // Coalesce conditions into one wrapped value per column. Mixed operators on
    // the same column aren't expressible in the column-filter shape — last wins.
    const wrappedByColumn = new Map<string, LogsColumnFilterValue>()
    for (const cond of next.conditions as FilterCondition[]) {
      const operator = cond.operator as LogsFilterOperator
      const existing = wrappedByColumn.get(cond.propertyName)
      if (!existing) {
        wrappedByColumn.set(cond.propertyName, { operator, values: [String(cond.value)] })
      } else {
        existing.values.push(String(cond.value))
        if (existing.operator !== operator) existing.operator = operator
      }
    }

    for (const [name, wrapped] of wrappedByColumn) {
      table.getColumn(name)?.setFilterValue(wrapped)
    }

    // Only clear filters owned by this bar — leaves externally-set filters
    // (e.g. the timeline date range) untouched.
    const managedNames = new Set(filterProperties.map((p) => p.name))
    const nextNames = new Set(wrappedByColumn.keys())
    const filtersToRemove = table
      .getState()
      .columnFilters.filter((x) => managedNames.has(x.id) && !nextNames.has(x.id))
    filtersToRemove.forEach((x) => {
      table.getColumn(x.id)?.setFilterValue(undefined)
    })
  }

  useEffect(() => {
    syncFromColumnFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
  }, [columnFilters])

  return (
    <FilterBar
      ref={filterBarRef}
      variant="pill"
      freeformDefaultProperty="event_message"
      className="bg-transparent border-0 [&>div>div>div>input]:!text-xs"
      filterProperties={filterProperties}
      freeformText={freeformText}
      filters={filters}
      onFilterChange={setFilters}
      onApply={onApply}
      onFreeformTextChange={setFreeformText}
      isLoading={isFetching}
      icon={
        isFetching ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-foreground-muted opacity-50" />
        ) : (
          <Search className="text-foreground-muted w-4 h-4 sticky" />
        )
      }
    />
  )
}
