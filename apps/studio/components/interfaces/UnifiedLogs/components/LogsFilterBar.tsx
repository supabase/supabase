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

import { isLogsFilterColumnValue } from '../UnifiedLogs.filters'
import {
  buildColumnFilterValues,
  buildFilterProperties,
  getUserFilterValue,
  USER_PROPERTY,
} from './LogsFilterBar.utils'
import { searchAuthUsers } from '@/components/interfaces/UserJourneys/UserJourneys.queries'
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
    // Non-timerange column filter values are always the wrapped `{ operator, values }`
    // shape; skip anything else (e.g. the `date` timerange brush, which isn't in
    // filterableNames, or an unexpected shape).
    if (!filterableNames.has(id) || !isLogsFilterColumnValue(value)) continue
    for (const v of value.values) {
      conditions.push({
        propertyName: id,
        value: v as FilterCondition['value'],
        operator: value.operator,
      })
    }
  }
  return { logicalOperator: 'AND', conditions }
}

export const LogsFilterBar = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { table, filterFields, columnFilters, isFetching } = useDataTable()

  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_FOCUS_FILTER, () => filterBarRef.current?.focus(), {
    registerInCommandMenu: true,
  })

  const filterBarRef = useRef<FilterBarHandle>(null)
  const [freeformText, setFreeformText] = useState('')

  // [Joshen] We're separately declaring useQueryState for user here, as there's no "user" column
  // in the Tanstack table.
  const [user, setUser] = useQueryState(USER_PROPERTY, parseAsString)

  // A UUID is matched exactly rather than searched (it's already a resolved id, not a keyword).
  const searchUserOptions = async (search?: string) => {
    const value = search?.trim() ?? ''
    if (UUID_REGEX.test(value)) return [{ label: value, value }]
    if (!projectRef) return []
    const users = await searchAuthUsers(projectRef, project?.connectionString ?? null, value).catch(
      () => []
    )
    return users.map((u) => ({ label: u.email ?? u.id, value: u.id }))
  }

  const filterProperties = buildFilterProperties({
    fields: filterFields,
    userOptions: searchUserOptions,
  })

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

  const applyUser = (raw: string | undefined) => {
    const value = raw?.trim() ?? ''
    setUser(value || null)
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

    const columnFilterValues = buildColumnFilterValues(next.conditions as FilterCondition[])
    for (const [name, value] of columnFilterValues) {
      table.getColumn(name)?.setFilterValue(value)
    }

    // Only clear filters owned by this bar — leaves externally-set filters
    // (e.g. the timeline date range) untouched.
    const nextNames = new Set(columnFilterValues.keys())
    const filtersToRemove = table
      .getState()
      .columnFilters.filter((x) => columnBackedNames.has(x.id) && !nextNames.has(x.id))
    filtersToRemove.forEach((x) => {
      table.getColumn(x.id)?.setFilterValue(undefined)
    })
  }

  useEffect(() => {
    syncFromColumnFilters()
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
