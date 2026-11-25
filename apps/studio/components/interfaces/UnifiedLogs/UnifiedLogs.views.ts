import isEqual from 'lodash/isEqual'
import { isGroup, type FilterCondition, type FilterGroup } from 'ui-patterns/FilterBar'

import {
  getLogAttributeKey,
  logsFilterGroupsToUrlParams,
  logsFiltersToUrlParams,
  parseLogsFilterGroupUrlParams,
  parseLogsFilterUrlParams,
  TOP_LEVEL_ONLY_FILTER_COLUMNS,
  type LogsFilter,
  type LogsFilterGroup,
} from './UnifiedLogs.filters'
import type { SearchParamsType } from './UnifiedLogs.types'
import {
  logsViewFilterConditionSchema,
  logsViewFilterGroupSchema,
  logsViewOptionKeySchema,
  logsViewOptionsSchema,
} from '@/data/content/log-content-schema'

export const LOGS_VIEW_VERSION = 1 as const

export const VIEW_OPTION_KEYS = logsViewOptionKeySchema.options
export type ViewOptionKey = (typeof VIEW_OPTION_KEYS)[number]

export interface LogsView {
  id: string
  type: 'logs_view'
  version: typeof LOGS_VIEW_VERSION
  name: string
  logSource: string
  filters: FilterGroup
  viewOptions: Record<string, unknown>
}

export type LogsViewDraft = Omit<LogsView, 'id' | 'type' | 'version'>

type SavedViewSearchParams = {
  [Key in 'filter' | ViewOptionKey]: SearchParamsType[Key] | null
}

export interface ApplyViewResult {
  params: SavedViewSearchParams
  dropped: string[]
}

export interface UseLogsViewsResult {
  views: LogsView[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  isPending: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  retry: () => void
  createView: (input: LogsViewDraft) => Promise<string>
  updateView: (
    id: string,
    input: Partial<Pick<LogsView, 'name' | 'filters' | 'viewOptions'>>
  ) => Promise<void>
  deleteView: (id: string) => Promise<void>
}

export const serializeView = ({
  name,
  logSource,
  search,
}: {
  name: string
  logSource: string
  search: Pick<SearchParamsType, 'filter'> & Partial<Pick<SearchParamsType, ViewOptionKey>>
}): LogsViewDraft => {
  const toCondition = ({ column, operator, value }: LogsFilter): FilterCondition => ({
    propertyName: column,
    operator,
    value,
  })
  const conditions: (FilterCondition | FilterGroup)[] = [
    ...parseLogsFilterUrlParams(search.filter).map(toCondition),
    ...parseLogsFilterGroupUrlParams(search.filter).map((group): FilterGroup => ({
      logicalOperator: 'OR',
      conditions: group.filters.map(toCondition),
    })),
  ]

  const viewOptions: Record<string, unknown> = {}
  for (const key of VIEW_OPTION_KEYS) {
    const value = search[key]
    if (value === null || value === undefined) continue
    viewOptions[key] = value
  }

  return {
    name,
    logSource,
    filters: { logicalOperator: 'AND', conditions },
    viewOptions,
  }
}

// Inverse of serializeView. Unknown filter columns (not in `filterableNames`), filter groups
// that aren't a flat OR of valid conditions, and unknown viewOptions keys are dropped and
// reported in `dropped` instead of throwing. A group is dropped whole, since dropping one of
// its conditions would silently narrow the OR. Never reads or sets `date`.
export const applyView = (
  view: LogsView,
  { filterableNames }: { filterableNames: Set<string> }
): ApplyViewResult => {
  const dropped: string[] = []
  const filters: LogsFilter[] = []
  const groups: LogsFilterGroup[] = []

  const toLogsFilter = (condition: FilterCondition): LogsFilter | undefined => {
    const attributeKey = getLogAttributeKey(condition.propertyName)
    const isDynamicFilter =
      attributeKey !== undefined
        ? attributeKey.length > 0
        : /^[A-Za-z_][A-Za-z0-9_]*$/.test(condition.propertyName)
    if (
      condition.propertyName === 'date' ||
      (!filterableNames.has(condition.propertyName) && !isDynamicFilter)
    ) {
      return undefined
    }
    const parsed = logsViewFilterConditionSchema.safeParse(condition)
    if (!parsed.success) return undefined
    return {
      column: parsed.data.propertyName,
      operator: parsed.data.operator,
      value: String(parsed.data.value),
    }
  }

  for (const condition of view.filters.conditions) {
    if (!isGroup(condition)) {
      const filter = toLogsFilter(condition)
      if (filter) filters.push(filter)
      else dropped.push(condition.propertyName)
      continue
    }

    const parsedGroup = logsViewFilterGroupSchema.safeParse(condition)
    const candidates = parsedGroup.success ? parsedGroup.data.conditions.map(toLogsFilter) : []
    const groupFilters = candidates.flatMap((filter) => (filter ? [filter] : []))
    const isUsable =
      groupFilters.length > 0 &&
      groupFilters.length === candidates.length &&
      groupFilters.every(({ column }) => !TOP_LEVEL_ONLY_FILTER_COLUMNS.includes(column))
    if (isUsable) groups.push({ operator: 'or', filters: groupFilters })
    else dropped.push('(filter group)')
  }

  const options = logsViewOptionsSchema.safeParse(view.viewOptions)
  if (!options.success) dropped.push(...options.error.issues.map((issue) => issue.path.join('.')))
  for (const key of Object.keys(view.viewOptions)) {
    if (!logsViewOptionKeySchema.safeParse(key).success) dropped.push(key)
  }
  const params: SavedViewSearchParams = {
    filter: [...logsFiltersToUrlParams(filters), ...logsFilterGroupsToUrlParams(groups)],
    latency: null,
    'timing.dns': null,
    'timing.connection': null,
    'timing.tls': null,
    'timing.ttfb': null,
    'timing.transfer': null,
    sort: null,
    show_connection_logs: null,
    edge_auth: null,
    edge_storage: null,
    edge_postgrest: null,
    user: null,
    ...(options.success ? options.data : {}),
  }
  return { params, dropped }
}

export const isViewModified = (
  view: LogsView,
  search: Pick<SearchParamsType, 'filter'> & Partial<Pick<SearchParamsType, ViewOptionKey>>
): boolean => {
  const current = serializeView({ name: view.name, logSource: view.logSource, search })
  const normalizedOptions = (options: Record<string, unknown>) =>
    Object.fromEntries(
      VIEW_OPTION_KEYS.map((key) => [
        key,
        options[key] ??
          (['show_connection_logs', 'edge_auth', 'edge_storage', 'edge_postgrest'].includes(key)
            ? true
            : null),
      ])
    )
  return (
    !isEqual(current.filters, view.filters) ||
    !isEqual(normalizedOptions(current.viewOptions), normalizedOptions(view.viewOptions))
  )
}

export const countActiveFilters = (view: LogsView): number => {
  const count = (conditions: (FilterCondition | FilterGroup)[]): number =>
    conditions.reduce(
      (total, condition) => total + (isGroup(condition) ? count(condition.conditions) : 1),
      0
    )
  return count(view.filters.conditions)
}
