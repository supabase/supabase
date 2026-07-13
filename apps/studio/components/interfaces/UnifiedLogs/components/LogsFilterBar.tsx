import { useParams } from 'common'
import { LoaderCircle, Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  FilterBar,
  FilterCondition,
  type FilterBarHandle,
  type FilterGroup,
} from 'ui-patterns/FilterBar'

import {
  isLogsFilterColumnValue,
  type LogsColumnFilterValue,
  type LogsFilterOperator,
} from '../UnifiedLogs.filters'
import { buildFilterProperties, getUserFilterValue, USER_PROPERTY } from './LogsFilterBar.utils'
import { searchAuthUserByEmail } from '@/components/interfaces/UserJourneys/UserJourneys.queries'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { UUID_REGEX } from '@/lib/constants'
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
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [user, setUser] = useQueryState(USER_PROPERTY, parseAsString)

  const filterBarRef = useRef<FilterBarHandle>(null)
  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_FOCUS_FILTER, () => filterBarRef.current?.focus(), {
    registerInCommandMenu: true,
  })

  const [freeformText, setFreeformText] = useState('')

  const filterProperties = buildFilterProperties(filterFields)

  const withUserCondition = (group: FilterGroup): FilterGroup => {
    if (!user) return group
    return {
      ...group,
      conditions: [
        ...group.conditions,
        { propertyName: USER_PROPERTY, value: user, operator: '=' },
      ],
    }
  }

  const columnBackedNames = new Set(
    filterProperties.map((p) => p.name).filter((name) => name !== USER_PROPERTY)
  )

  // Local state because the FilterBar carries transient states
  const [filters, setFilters] = useState<FilterGroup>(() =>
    withUserCondition(buildFilterGroup(columnFilters, columnBackedNames))
  )

  // Read latest values without making the effect depend on their (per-render) identity.
  const syncFromColumnFilters = useEffectEvent(() => {
    setFilters(withUserCondition(buildFilterGroup(columnFilters, columnBackedNames)))
  })

  const applyUser = async (raw: string | undefined) => {
    const value = raw?.trim() ?? ''
    if (!value) {
      setUser(null)
      return
    }
    // An email is resolved to a user id where an account exists (so it also matches
    // postgres error text, which carries the id, not the email); otherwise kept as-is.
    if (UUID_REGEX.test(value) || !value.includes('@')) {
      setUser(value)
      return
    }
    const resolved = await searchAuthUserByEmail(
      projectRef!,
      project?.connectionString ?? null,
      value
    ).catch(() => undefined)
    setUser(resolved?.id ?? value)
  }

  // No nested conditions in unified logs — type-cast to FilterCondition on read.
  const onApply = (next: FilterGroup) => {
    const isValid = next.conditions.every(
      (x) =>
        !!(x as FilterCondition).operator &&
        !!(x as FilterCondition).value &&
        !!(x as FilterCondition).propertyName
    )
    if (!isValid) return

    applyUser(getUserFilterValue(next.conditions as FilterCondition[]))

    const wrappedByColumn = new Map<string, LogsColumnFilterValue>()
    for (const cond of next.conditions as FilterCondition[]) {
      if (cond.propertyName === USER_PROPERTY) continue
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
    const nextNames = new Set(wrappedByColumn.keys())
    const filtersToRemove = table
      .getState()
      .columnFilters.filter((x) => columnBackedNames.has(x.id) && !nextNames.has(x.id))
    filtersToRemove.forEach((x) => {
      table.getColumn(x.id)?.setFilterValue(undefined)
    })
  }

  useEffect(() => {
    syncFromColumnFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
  }, [columnFilters, user])

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
