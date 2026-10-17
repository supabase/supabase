import * as z from 'zod'

import {
  databaseSourceSchema,
  logsSourceSchema,
  type DatabaseSourceParameters,
  type LogsSourceParameters,
  type TimeRange,
} from '@/data/content/notebooks/notebook-schema'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'

/**
 * The backend a query runs against. A closed set, not a runtime-extensible one: each tag
 * is a distinct SQL dialect with its own escaping rules, wire boundary, and safe-SQL
 * brand, so picking the wrong one is a security bug rather than a configuration error.
 * What this registry *does* enumerate at runtime is everything downstream of that choice
 * — endpoints, labels, icons, availability, and default parameters.
 *
 * The parameter shapes themselves live in the notebook wire schema
 * (data/content/notebooks/notebook-schema.ts), which is the contract shared with the API
 * and the agent tool surface; this module borrows them so there is exactly one definition.
 */
export type QuerySourceTag = 'database' | 'logs'

export type DatabaseSource = {
  _tag: 'database'
  endpoint: '/platform/pg-meta/{ref}/query'
  parameters: DatabaseSourceParameters
}

export type LogsSource = {
  _tag: 'logs'
  endpoint: ReturnType<typeof logsAllEndpointUrl>
  parameters: LogsSourceParameters
}

export type Source = DatabaseSource | LogsSource

/**
 * A query's source selection as the UI passes it around: the backend tag with that
 * backend's parameters spread flat alongside it. Carriers (notebook cells, standalone
 * Explorer query drafts) store these fields inline rather than under a `source` key; this
 * type is the portable value the shared source menu reads and emits.
 */
export type QuerySourceBinding =
  | ({ _tag: 'database' } & DatabaseSourceParameters)
  | ({ _tag: 'logs' } & LogsSourceParameters)

export const querySourceBindingSchema = z.discriminatedUnion('_tag', [
  z.object({ _tag: z.literal('database'), ...databaseSourceSchema.shape }).strict(),
  z.object({ _tag: z.literal('logs'), ...logsSourceSchema.shape }).strict(),
])

export const DEFAULT_LOG_TIME_RANGE: TimeRange = {
  _tag: 'relative_time_range',
  unit: 'hour',
  amount: 1,
}

export const QUERY_SOURCE_REGISTRY = {
  database: {
    _tag: 'database',
    endpoint: '/platform/pg-meta/{ref}/query',
    parameters: {},
  },
  logs: {
    _tag: 'logs',
    endpoint: logsAllEndpointUrl(true),
    parameters: { time_range: DEFAULT_LOG_TIME_RANGE },
  },
} as const satisfies Record<QuerySourceTag, Source>

export const QUERY_SOURCES = Object.values(QUERY_SOURCE_REGISTRY) satisfies Source[]

export const QUERY_SOURCE_LABELS: Record<QuerySourceTag, string> = {
  database: 'Database',
  logs: 'Logs',
}

export const getQuerySource = (tag: QuerySourceTag): Source => QUERY_SOURCE_REGISTRY[tag]

/** Defensive copy so a valtio-proxied range never leaks into a freshly built binding. */
const cloneTimeRange = (range: Readonly<TimeRange>): TimeRange =>
  range._tag === 'relative_time_range'
    ? { _tag: range._tag, unit: range.unit, amount: range.amount }
    : { _tag: range._tag, start: range.start, end: range.end }

export function createDefaultSourceBinding(
  tag: 'database'
): { _tag: 'database' } & DatabaseSourceParameters
export function createDefaultSourceBinding(tag: 'logs'): { _tag: 'logs' } & LogsSourceParameters
export function createDefaultSourceBinding(tag: QuerySourceTag): QuerySourceBinding
export function createDefaultSourceBinding(tag: QuerySourceTag): QuerySourceBinding {
  if (tag === 'logs') {
    return {
      _tag: 'logs',
      time_range: cloneTimeRange(QUERY_SOURCE_REGISTRY.logs.parameters.time_range),
    }
  }
  return { _tag: 'database' }
}

export const getQuerySourceLabel = (tag: QuerySourceTag): string => QUERY_SOURCE_LABELS[tag]

/**
 * Source parameters as any carrier stores them: spread flat alongside a tag. Stated
 * structurally, and readonly throughout, so one helper serves wire cells, domain cells
 * (whose `sql` has been rebranded to `unchecked_sql`), standalone query drafts, and the
 * deep-readonly `Snapshot` values valtio hands the UI.
 */
type SourceTagged<DatabaseTag extends string, LogsTag extends string> =
  | { readonly _tag: DatabaseTag; readonly database_identifier?: string }
  | { readonly _tag: LogsTag; readonly time_range: Readonly<TimeRange> }

type DatabaseBinding = { _tag: 'database' } & DatabaseSourceParameters
type LogsBinding = { _tag: 'logs' } & LogsSourceParameters

/**
 * Projects any backend-tagged carrier onto the binding the shared source menu reads, so a
 * caller never reaches into per-backend fields itself. Used by standalone query drafts and
 * by the query editor's own model; notebook cells go through `getQuerySourceBinding`,
 * which maps their cell tags first.
 *
 * Overloaded so a caller that has already narrowed its carrier gets the matching binding
 * back rather than the whole union — that keeps the result spreadable into a narrowed
 * result type without re-narrowing.
 */
export function toQuerySourceBinding(value: SourceTagged<'database', never>): DatabaseBinding
export function toQuerySourceBinding(value: SourceTagged<never, 'logs'>): LogsBinding
export function toQuerySourceBinding(value: SourceTagged<'database', 'logs'>): QuerySourceBinding
export function toQuerySourceBinding(value: SourceTagged<'database', 'logs'>): QuerySourceBinding {
  if (value._tag === 'logs') return { _tag: 'logs', time_range: cloneTimeRange(value.time_range) }
  return { _tag: 'database', database_identifier: value.database_identifier }
}

/**
 * Projects a notebook query cell onto its source binding. The inverse — applying a binding
 * back onto a cell — is `changeCellSource`, which additionally has to decide what happens
 * to the SQL body when the backend changes.
 */
export function getQuerySourceBinding(cell: SourceTagged<'database_cell', never>): DatabaseBinding
export function getQuerySourceBinding(cell: SourceTagged<never, 'log_cell'>): LogsBinding
export function getQuerySourceBinding(
  cell: SourceTagged<'database_cell', 'log_cell'>
): QuerySourceBinding
export function getQuerySourceBinding(
  cell: SourceTagged<'database_cell', 'log_cell'>
): QuerySourceBinding {
  if (cell._tag === 'log_cell') {
    return toQuerySourceBinding({ _tag: 'logs', time_range: cell.time_range })
  }
  return toQuerySourceBinding({ _tag: 'database', database_identifier: cell.database_identifier })
}
