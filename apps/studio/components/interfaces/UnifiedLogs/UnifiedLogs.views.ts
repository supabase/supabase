import isEqual from 'lodash/isEqual'
import { isGroup, type FilterCondition, type FilterGroup } from 'ui-patterns/FilterBar'

import {
  getLogAttributeKey,
  logsFiltersToUrlParams,
  parseLogsFilterUrlParams,
  type LogsFilter,
  type LogsFilterOperator,
} from './UnifiedLogs.filters'
import type { SearchParamsType } from './UnifiedLogs.types'

export const LOGS_VIEW_VERSION = 1 as const

export type ViewOptionKey =
  | 'latency'
  | 'timing.dns'
  | 'timing.connection'
  | 'timing.tls'
  | 'timing.ttfb'
  | 'timing.transfer'
  | 'sort'
  | 'show_connection_logs'
  | 'edge_auth'
  | 'edge_storage'
  | 'edge_postgrest'
  | 'user'

// The subset of SEARCH_PARAMS_PARSER (UnifiedLogs.constants.tsx) that defines a
// saved view, excluding `date` (time range), pagination (`start`/`cursor`/`direction`),
// `live`, and the open-row params (`uuid`/`id`).
export const VIEW_OPTION_KEYS: ViewOptionKey[] = [
  'latency',
  'timing.dns',
  'timing.connection',
  'timing.tls',
  'timing.ttfb',
  'timing.transfer',
  'sort',
  'show_connection_logs',
  'edge_auth',
  'edge_storage',
  'edge_postgrest',
  'user',
]

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

export interface ApplyViewResult {
  params: Partial<SearchParamsType>
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
  const conditions: FilterCondition[] = parseLogsFilterUrlParams(search.filter).map(
    ({ column, operator, value }): FilterCondition => ({ propertyName: column, operator, value })
  )

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

// Inverse of serializeView. Unknown filter columns (not in `filterableNames`), nested
// filter groups (only flat AND is produced today), and unknown viewOptions keys are
// dropped and reported in `dropped` instead of throwing. Never reads or sets `date`.
export const applyView = (
  view: LogsView,
  { filterableNames }: { filterableNames: Set<string> }
): ApplyViewResult => {
  const dropped: string[] = []
  const filters: LogsFilter[] = []

  for (const condition of view.filters.conditions) {
    if (isGroup(condition)) {
      dropped.push('(nested group)')
      continue
    }
    const attributeKey = getLogAttributeKey(condition.propertyName)
    const isDynamicFilter =
      attributeKey !== undefined
        ? attributeKey.length > 0
        : /^[A-Za-z_][A-Za-z0-9_]*$/.test(condition.propertyName)
    if (
      condition.propertyName === 'date' ||
      (!filterableNames.has(condition.propertyName) && !isDynamicFilter)
    ) {
      dropped.push(condition.propertyName)
      continue
    }
    filters.push({
      column: condition.propertyName,
      operator: condition.operator as LogsFilterOperator,
      value: String(condition.value),
    })
  }

  const params: Record<string, unknown> = {
    filter: filters.length > 0 ? logsFiltersToUrlParams(filters) : [],
  }

  for (const key of VIEW_OPTION_KEYS) params[key] = null

  for (const [key, value] of Object.entries(view.viewOptions)) {
    if (!VIEW_OPTION_KEYS.includes(key as ViewOptionKey)) {
      dropped.push(key)
      continue
    }
    params[key] = value
  }

  return { params: params as Partial<SearchParamsType>, dropped }
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
