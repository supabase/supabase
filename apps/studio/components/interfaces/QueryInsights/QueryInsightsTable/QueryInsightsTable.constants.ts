import { CircleAlert, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ISSUE_DOT_COLORS: Record<
  string,
  { border: string; background: string; color: string }
> = {
  error: {
    border: 'border-destructive-500',
    background: 'bg-destructive-200',
    color: 'text-destructive-600',
  },
  index: {
    border: 'border-warning-500',
    background: 'bg-warning-200',
    color: 'text-warning-600',
  },
  slow: {
    border: 'border-strong',
    background: 'bg-alternative dark:bg-muted',
    color: 'text-foreground-lighter',
  },
}

export const ISSUE_ICONS: Record<string, LucideIcon> = {
  error: CircleAlert,
  index: Lightbulb,
  slow: CircleAlert,
}

export const QUERY_INSIGHTS_EXPLORER_COLUMNS = [
  { id: 'query', name: 'Query', description: undefined, minWidth: 500 },
  { id: 'prop_total_time', name: 'Time consumed', description: undefined, minWidth: 150 },
  { id: 'calls', name: 'Calls', description: undefined, minWidth: 100 },
  { id: 'max_time', name: 'Max time', description: undefined, minWidth: 100 },
  { id: 'mean_time', name: 'Mean time', description: undefined, minWidth: 100 },
  { id: 'min_time', name: 'Min time', description: undefined, minWidth: 100 },
  { id: 'rows_read', name: 'Rows processed', description: undefined, minWidth: 130 },
  { id: 'cache_hit_rate', name: 'Cache hit rate', description: undefined, minWidth: 130 },
  { id: 'rolname', name: 'Role', description: undefined, minWidth: 200 },
  { id: 'application_name', name: 'Application', description: undefined, minWidth: 200 },
] as const

export const NON_SORTABLE_COLUMNS = ['query'] as const
