import { isGroup, type FilterCondition, type FilterGroup } from 'ui-patterns/FilterBar'

import {
  getLogAttributeKey,
  groupLogsFiltersByColumn,
  LOGS_FILTER_OPERATOR_VERBS,
  type LogsFilter,
} from '../UnifiedLogs.filters'
import { type ViewOptionKey } from '../UnifiedLogs.views'

export const VIEW_OPTION_LABELS: Record<ViewOptionKey, string> = {
  latency: 'Latency',
  'timing.dns': 'DNS timing',
  'timing.connection': 'Connection timing',
  'timing.tls': 'TLS timing',
  'timing.ttfb': 'TTFB timing',
  'timing.transfer': 'Transfer timing',
  sort: 'Sort',
  show_connection_logs: 'Connection logs',
  edge_auth: 'Auth logs',
  edge_storage: 'Storage logs',
  edge_postgrest: 'PostgREST logs',
  user: 'User',
}

export interface SummaryRow {
  label: string
  text: string
}

export const buildFilterSummary = (
  filters: FilterGroup,
  columnLabels: Record<string, string>
): SummaryRow[] => {
  const logsFilters: LogsFilter[] = filters.conditions
    .filter((condition): condition is FilterCondition => !isGroup(condition))
    .map((condition) => ({
      column: condition.propertyName,
      operator: condition.operator as LogsFilter['operator'],
      value: String(condition.value),
    }))

  return Object.entries(groupLogsFiltersByColumn(logsFilters)).map(
    ([column, { operator, values }]) => ({
      label: columnLabels[column] ?? getLogAttributeKey(column) ?? column,
      text: `${LOGS_FILTER_OPERATOR_VERBS[operator]} ${values.join(', ')}`,
    })
  )
}

const formatViewOptionValue = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'On' : 'Off'
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object' && 'id' in value && 'desc' in value) {
    const sort = value as { id: string; desc: boolean }
    return `${sort.id} (${sort.desc ? 'desc' : 'asc'})`
  }
  return String(value)
}

export const buildOptionsSummary = (viewOptions: Record<string, unknown>): SummaryRow[] =>
  Object.entries(viewOptions).map(([key, value]) => ({
    label: VIEW_OPTION_LABELS[key as ViewOptionKey] ?? key,
    text: formatViewOptionValue(value),
  }))

export const isDuplicateViewName = (name: string, existingNames: string[]): boolean => {
  const normalized = name.trim().toLowerCase()
  return existingNames.some((existing) => existing.trim().toLowerCase() === normalized)
}
