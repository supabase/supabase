import { useQueries } from '@tanstack/react-query'
import { useParams } from 'common'
import { LoaderCircleIcon, SearchIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  FilterBar,
  FilterCondition,
  type CustomOptionProps,
  type FilterBarHandle,
  type FilterGroup,
} from 'ui-patterns/FilterBar'

import { filterFields as defaultFilterFields } from '../UnifiedLogs.fields'
import { getLogAttributeKey, logAttributeFilterId } from '../UnifiedLogs.filters'
import type { QuerySearchParamsType } from '../UnifiedLogs.types'
import { isOfferedFilter } from '../UnifiedLogs.utils'
import {
  buildColumnFilterValues,
  buildFilterGroup,
  buildFilterProperties,
  getLogAttributeSources,
  getUserFilterValue,
  TIME_RANGE_PROPERTY,
  USER_PROPERTY,
} from './LogsFilterBar.utils'
import {
  parseTimeRange,
  serializeTimeRange,
} from '@/components/interfaces/Settings/Logs/Logs.timeRange'
import { searchAuthUsers } from '@/components/interfaces/UserJourneys/UserJourneys.queries'
import { DataTableFilterTimerange } from '@/components/ui/DataTable/DataTableFilters/DataTableFilterTimerange'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { otelLogKeysQueryOptions } from '@/data/logs/otel-log-keys-query'
import { useUnifiedLogsBackend } from '@/data/logs/unified-logs-infinite-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { UUID_REGEX } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const TimeRangeOption = ({ onChange }: CustomOptionProps) => (
  <DataTableFilterTimerange
    label="Time range"
    value={TIME_RANGE_PROPERTY}
    type="timerange"
    variant="inline"
    onChange={(range) => onChange(serializeTimeRange(range))}
  />
)

interface LogsFilterBarProps {
  offeredFilters?: readonly string[]
}

export const LogsFilterBar = ({ offeredFilters }: LogsFilterBarProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { table, filterFields, columnFilters, isFetching, searchParameters } = useDataTable<
    unknown,
    unknown,
    QuerySearchParamsType
  >()
  const isOtel = useUnifiedLogsBackend(searchParameters)

  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_FOCUS_FILTER, () => filterBarRef.current?.focus(), {
    registerInCommandMenu: true,
  })

  const filterBarRef = useRef<FilterBarHandle>(null)
  const [freeformText, setFreeformText] = useState('')
  const [hasFocusedFilterBar, setHasFocusedFilterBar] = useState(false)

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
    timeRangeOptions: { component: TimeRangeOption },
  }).filter((property) => isOfferedFilter(property.name, offeredFilters))

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

  const columnBackedNames = new Set([
    ...filterProperties.map((p) => p.name).filter((name) => name !== USER_PROPERTY),
    ...columnFilters
      .filter(({ id }) => !defaultFilterFields.some((field) => field.value === id))
      .map(({ id }) => id),
  ])

  const [filters, setFilters] = useState<FilterGroup>(() =>
    withUserCondition(buildFilterGroup(columnFilters, columnBackedNames))
  )

  const canDiscoverAttributes = isOtel && !!projectRef && hasFocusedFilterBar
  const sources = getLogAttributeSources(searchParameters)
  const keyQueries = useQueries({
    queries: sources.map((source) => ({
      ...otelLogKeysQueryOptions({ projectRef: projectRef ?? '', source }),
      enabled: canDiscoverAttributes,
    })),
  })
  let attributeDiscoveryStatus = ''
  if (canDiscoverAttributes) {
    if (keyQueries.some(({ isFetching }) => isFetching)) {
      attributeDiscoveryStatus = 'Loading log attributes.'
    } else if (keyQueries.some(({ isError }) => isError)) {
      attributeDiscoveryStatus = 'Some log attributes could not be loaded.'
    } else if (keyQueries.length > 0 && keyQueries.every(({ isSuccess }) => isSuccess)) {
      attributeDiscoveryStatus = 'Log attributes loaded.'
    }
  }
  const attributeKeys = new Set(keyQueries.flatMap(({ data }) => data ?? []))
  if (isOtel && freeformText.trim()) attributeKeys.add(freeformText.trim())
  for (const condition of filters.conditions) {
    if (!('propertyName' in condition)) continue
    const key = getLogAttributeKey(condition.propertyName)
    if (key !== undefined) attributeKeys.add(key)
  }
  const legacyAttributeProperties = columnFilters
    .filter(
      ({ id }) =>
        id !== USER_PROPERTY &&
        getLogAttributeKey(id) === undefined &&
        !defaultFilterFields.some((field) => field.value === id)
    )
    .map(({ id }) => ({
      label: `Attribute: ${id}`,
      name: id,
      type: 'string' as const,
      operators: [
        { label: 'Equals', value: '=' },
        { label: 'Not equal', value: '<>' },
      ],
    }))
  const attributeProperties = isOtel
    ? [...attributeKeys].map((key) => ({
        label: `Attribute: ${key}`,
        name: logAttributeFilterId(key),
        type: 'string' as const,
        operators: [
          { label: 'Equals', value: '=', group: 'comparison' as const },
          { label: 'Not equal', value: '<>', group: 'comparison' as const },
        ],
      }))
    : []
  for (const property of attributeProperties) columnBackedNames.add(property.name)

  const hasTimeRangeFilter = filters.conditions.some(
    (condition) => 'propertyName' in condition && condition.propertyName === TIME_RANGE_PROPERTY
  )
  const filterPropertiesWithAvailability = [
    ...filterProperties,
    ...attributeProperties,
    ...legacyAttributeProperties,
  ].map((property) => ({
    ...property,
    isAvailable: property.name !== TIME_RANGE_PROPERTY || !hasTimeRangeFilter,
  }))

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

    const timeRangeCondition = (next.conditions as FilterCondition[]).find(
      (condition) => condition.propertyName === TIME_RANGE_PROPERTY
    )
    const timeRange = parseTimeRange(timeRangeCondition?.value)
    if (timeRangeCondition && !timeRange) return

    applyUser(getUserFilterValue(next.conditions as FilterCondition[]))
    const columnFilterValues = buildColumnFilterValues(next.conditions as FilterCondition[])
    table.setColumnFilters((current) => [
      ...current.filter(({ id }) => !columnBackedNames.has(id)),
      ...Array.from(columnFilterValues, ([id, value]) => ({ id, value })),
      ...(timeRange ? [{ id: TIME_RANGE_PROPERTY, value: timeRange }] : []),
    ])
  }

  useEffect(() => {
    syncFromColumnFilters()
  }, [columnFilters, user])

  return (
    <div onFocusCapture={() => setHasFocusedFilterBar(true)}>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {attributeDiscoveryStatus}
      </span>
      <FilterBar
        ref={filterBarRef}
        variant="pill"
        freeformDefaultProperty="event_message"
        className="bg-transparent border-0 [&>div>div>div>input]:!text-xs"
        filterProperties={filterPropertiesWithAvailability}
        freeformText={freeformText}
        filters={filters}
        onFilterChange={setFilters}
        onApply={onApply}
        onFreeformTextChange={setFreeformText}
        isLoading={isFetching}
        icon={
          isFetching ? (
            <LoaderCircleIcon className="h-4 w-4 animate-spin text-foreground-muted opacity-50" />
          ) : (
            <SearchIcon className="text-foreground-muted w-4 h-4 sticky" />
          )
        }
      />
    </div>
  )
}
