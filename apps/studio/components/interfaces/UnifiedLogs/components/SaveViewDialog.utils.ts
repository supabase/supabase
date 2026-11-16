import { isGroup, type FilterGroup } from 'ui-patterns/FilterBar'

import { getLogAttributeKey } from '../UnifiedLogs.filters'
import { type ViewOptionKey } from '../UnifiedLogs.views'
import {
  logsViewFilterConditionSchema,
  logsViewOptionKeySchema,
  logsViewOptionsSchema,
  logsViewSortSchema,
} from '@/data/content/log-content-schema'

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

export interface FilterSummaryPill {
  label: string
  operator: string
  value: string
}

export const buildFilterSummary = (
  filters: FilterGroup,
  columnLabels: Record<string, string>
): FilterSummaryPill[] =>
  filters.conditions.flatMap((condition) => {
    if (isGroup(condition)) return []
    const result = logsViewFilterConditionSchema.safeParse(condition)
    if (!result.success) return []
    const { propertyName, operator, value } = result.data
    return [
      {
        label: columnLabels[propertyName] ?? getLogAttributeKey(propertyName) ?? propertyName,
        operator,
        value: String(value),
      },
    ]
  })

const formatViewOptionValue = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'On' : 'Off'
  if (Array.isArray(value)) return value.join(', ')
  const sort = logsViewSortSchema.safeParse(value)
  if (sort.success) return `${sort.data.id} (${sort.data.desc ? 'desc' : 'asc'})`
  return String(value)
}

export const buildOptionsSummary = (viewOptions: Record<string, unknown>): SummaryRow[] =>
  Object.entries(viewOptions).flatMap(([key, value]) => {
    const parsedKey = logsViewOptionKeySchema.safeParse(key)
    if (parsedKey.success && !logsViewOptionsSchema.shape[parsedKey.data].safeParse(value).success)
      return []
    return [
      {
        label: parsedKey.success ? VIEW_OPTION_LABELS[parsedKey.data] : key,
        text: formatViewOptionValue(value),
      },
    ]
  })

export const isDuplicateViewName = (name: string, existingNames: string[]): boolean => {
  const normalized = name.trim().toLowerCase()
  return existingNames.some((existing) => existing.trim().toLowerCase() === normalized)
}
