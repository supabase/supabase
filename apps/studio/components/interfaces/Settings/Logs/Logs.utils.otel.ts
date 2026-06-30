import dayjs from 'dayjs'
import { z } from 'zod'

import { LogsTableName, type SqlFilterEntry } from './Logs.constants'
import type { Filters, LogData, LogsEndpointParams, Metadata, QueryType } from './Logs.types'
import { buildWhereClauses } from './Logs.utils'
import { parseOtelTimestamp } from '@/data/logs/otel-inspection.utils'
import {
  joinSqlFragments,
  analyticsLiteral as lit,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'

// Builds ClickHouse SQL for the OTEL `logs` table (one table for all sources,
// fields in the `log_attributes` map). Mirrors the BigQuery builders in
// Logs.utils.ts, aliasing columns to the names the row renderers already read.

const attr = (key: string): SafeLogSqlFragment => safeSql`log_attributes[${lit(key)}]`
const statusAsInt = (key: string): SafeLogSqlFragment => safeSql`toInt32OrZero(${attr(key)})`

// Severity conditions, shared by the chart and the auth filters so a row is
// classified the same everywhere.
const HTTP_ERROR: SafeLogSqlFragment = safeSql`${statusAsInt('response.status_code')} >= 500`
const HTTP_WARNING: SafeLogSqlFragment = safeSql`${statusAsInt('response.status_code')} BETWEEN 400 AND 499`
const PG_ERROR: SafeLogSqlFragment = safeSql`${attr('parsed.error_severity')} IN ('ERROR', 'FATAL', 'PANIC')`
const PG_WARNING: SafeLogSqlFragment = safeSql`${attr('parsed.error_severity')} = 'WARNING'`
const FN_ERROR: SafeLogSqlFragment = safeSql`${attr('level')} IN ('error', 'fatal')`
const FN_WARNING: SafeLogSqlFragment = safeSql`${attr('level')} = 'warning'`
const MULTIGRES_ERROR: SafeLogSqlFragment = safeSql`JSONExtractString(event_message, 'level') IN ('ERROR', 'FATAL', 'PANIC')`
const MULTIGRES_WARNING: SafeLogSqlFragment = safeSql`JSONExtractString(event_message, 'level') IN ('WARN', 'WARNING')`
const AUTH_ERROR: SafeLogSqlFragment = safeSql`${attr('level')} IN ('error', 'fatal') OR ${statusAsInt('status')} >= 500`
const AUTH_WARNING: SafeLogSqlFragment = safeSql`${attr('level')} = 'warning' OR ${statusAsInt('status')} BETWEEN 400 AND 499`
const AUTH_INFO: SafeLogSqlFragment = safeSql`NOT (${AUTH_ERROR}) AND NOT (${AUTH_WARNING})`
// Tables with no severity: every row counts as ok.
const NO_MATCH: SafeLogSqlFragment = safeSql`0`

const PG_CRON_CONDITION: SafeLogSqlFragment = safeSql`(${attr('parsed.application_name')} = 'pg_cron' OR event_message ILIKE '%cron job%')`

const COMMON_FILTERS: Record<string, SqlFilterEntry> = {
  search_query: (value: string) => safeSql`event_message ILIKE ${lit('%' + value + '%')}`,
}
const databaseFilter = (value: string): SafeLogSqlFragment =>
  safeSql`${attr('identifier')} = ${lit(value)}`

// ClickHouse filters per table. Tables not listed use COMMON_FILTERS only.
const POSTGRES_FILTERS: Record<string, SqlFilterEntry> = {
  ...COMMON_FILTERS,
  database: databaseFilter,
  'severity.error': PG_ERROR,
  'severity.noError': safeSql`${attr('parsed.error_severity')} NOT IN ('ERROR', 'FATAL', 'PANIC')`,
  'severity.log': safeSql`${attr('parsed.error_severity')} = 'LOG'`,
}
const STATUS_CODE_FILTERS: Record<string, SqlFilterEntry> = {
  'status_code.error': safeSql`${statusAsInt('response.status_code')} BETWEEN 500 AND 599`,
  'status_code.success': safeSql`${statusAsInt('response.status_code')} BETWEEN 200 AND 299`,
  'status_code.warning': safeSql`${statusAsInt('response.status_code')} BETWEEN 400 AND 499`,
}
const EDGE_FILTERS: Record<string, SqlFilterEntry> = {
  ...COMMON_FILTERS,
  database: databaseFilter,
  ...STATUS_CODE_FILTERS,
  'product.database': safeSql`${attr('request.path')} LIKE '/rest/%' OR ${attr('request.path')} LIKE '/graphql/%'`,
  'product.storage': safeSql`${attr('request.path')} LIKE '/storage/%'`,
  'product.auth': safeSql`${attr('request.path')} LIKE '/auth/%'`,
  'product.realtime': safeSql`${attr('request.path')} LIKE '/realtime/%'`,
  'method.get': safeSql`${attr('request.method')} = 'GET'`,
  'method.post': safeSql`${attr('request.method')} = 'POST'`,
  'method.put': safeSql`${attr('request.method')} = 'PUT'`,
  'method.patch': safeSql`${attr('request.method')} = 'PATCH'`,
  'method.delete': safeSql`${attr('request.method')} = 'DELETE'`,
  'method.options': safeSql`${attr('request.method')} = 'OPTIONS'`,
}
const FUNCTION_LOGS_FILTERS: Record<string, SqlFilterEntry> = {
  ...COMMON_FILTERS,
  'severity.error': safeSql`${attr('level')} = 'error'`,
  'severity.notError': safeSql`${attr('level')} != 'error'`,
  'severity.log': safeSql`${attr('level')} = 'log'`,
  'severity.info': safeSql`${attr('level')} = 'info'`,
  'severity.debug': safeSql`${attr('level')} = 'debug'`,
  'severity.warn': safeSql`${attr('level')} = 'warn'`,
}
const AUTH_FILTERS: Record<string, SqlFilterEntry> = {
  ...COMMON_FILTERS,
  'severity.error': AUTH_ERROR,
  'severity.warning': AUTH_WARNING,
  'severity.info': AUTH_INFO,
  'status_code.server_error': safeSql`${statusAsInt('status')} BETWEEN 500 AND 599`,
  'status_code.client_error': safeSql`${statusAsInt('status')} BETWEEN 400 AND 499`,
  'status_code.redirection': safeSql`${statusAsInt('status')} BETWEEN 300 AND 399`,
  'status_code.success': safeSql`${statusAsInt('status')} BETWEEN 200 AND 299`,
  'endpoints.admin': safeSql`match(${attr('path')}, '/admin')`,
  'endpoints.signup': safeSql`match(${attr('path')}, '/signup|/invite|/verify')`,
  'endpoints.authentication': safeSql`match(${attr('path')}, '/token|/authorize|/callback|/otp|/magiclink')`,
  'endpoints.recover': safeSql`match(${attr('path')}, '/recover')`,
  'endpoints.user': safeSql`match(${attr('path')}, '/user')`,
  'endpoints.logout': safeSql`match(${attr('path')}, '/logout')`,
}
const SUPAVISOR_FILTERS: Record<string, SqlFilterEntry> = {
  ...COMMON_FILTERS,
  database: (value: string) => safeSql`${attr('project')} LIKE ${lit(value + '%')}`,
}
const ETL_FILTERS: Record<string, SqlFilterEntry> = {
  ...COMMON_FILTERS,
  // pipeline_id arrives as a number, but log_attributes values are strings, so
  // compare as a string. A numeric literal here is a ClickHouse type error.
  pipeline_id: (value: string | number) => safeSql`${attr('pipeline_id')} = ${lit(String(value))}`,
}

const col = (key: string, alias: SafeLogSqlFragment): SafeLogSqlFragment =>
  safeSql`${attr(key)} AS ${alias}`

// What varies per table. Everything but `source` is optional, so a plain
// process-log table is just `{ source }`.
interface OtelSourceDescriptor {
  source: string
  // Columns beyond id/timestamp/event_message, aliased to the renderer names.
  columns?: SafeLogSqlFragment[]
  filterTemplates?: Record<string, SqlFilterEntry>
  // Chart severity; absent means the table has no error/warning.
  error?: SafeLogSqlFragment
  warning?: SafeLogSqlFragment
  // Always ANDed with the source filter (e.g. the pg_cron subset).
  baseCondition?: SafeLogSqlFragment
}

const OTEL_SOURCES: Record<LogsTableName, OtelSourceDescriptor> = {
  [LogsTableName.EDGE]: {
    source: 'edge_logs',
    columns: [
      col('identifier', safeSql`identifier`),
      col('request.method', safeSql`method`),
      col('request.path', safeSql`path`),
      col('request.search', safeSql`search`),
      col('response.status_code', safeSql`status_code`),
    ],
    filterTemplates: EDGE_FILTERS,
    error: HTTP_ERROR,
    warning: HTTP_WARNING,
  },
  [LogsTableName.POSTGRES]: {
    source: 'postgres_logs',
    columns: [
      col('identifier', safeSql`identifier`),
      col('parsed.error_severity', safeSql`error_severity`),
      col('parsed.detail', safeSql`detail`),
      col('parsed.hint', safeSql`hint`),
    ],
    filterTemplates: POSTGRES_FILTERS,
    error: PG_ERROR,
    warning: PG_WARNING,
  },
  [LogsTableName.PG_CRON]: {
    source: 'postgres_logs',
    columns: [
      col('parsed.error_severity', safeSql`error_severity`),
      col('parsed.query', safeSql`query`),
    ],
    error: PG_ERROR,
    // No warning bucket, to match BigQuery (where pg_cron has no warning case).
    baseCondition: PG_CRON_CONDITION,
  },
  [LogsTableName.FUNCTIONS]: {
    source: 'function_logs',
    columns: [
      col('event_type', safeSql`event_type`),
      col('function_id', safeSql`function_id`),
      col('execution_id', safeSql`execution_id`),
      col('level', safeSql`level`),
    ],
    filterTemplates: FUNCTION_LOGS_FILTERS,
    error: FN_ERROR,
    warning: FN_WARNING,
  },
  [LogsTableName.FN_EDGE]: {
    source: 'function_edge_logs',
    columns: [
      col('response.status_code', safeSql`status_code`),
      col('request.method', safeSql`method`),
      col('request.pathname', safeSql`pathname`),
      col('function_id', safeSql`function_id`),
      col('execution_id', safeSql`execution_id`),
      col('execution_time_ms', safeSql`execution_time_ms`),
      col('deployment_id', safeSql`deployment_id`),
      col('version', safeSql`version`),
    ],
    filterTemplates: { ...COMMON_FILTERS, ...STATUS_CODE_FILTERS },
    error: HTTP_ERROR,
    warning: HTTP_WARNING,
  },
  [LogsTableName.AUTH]: {
    source: 'auth_logs',
    columns: [
      col('level', safeSql`level`),
      col('status', safeSql`status`),
      col('path', safeSql`path`),
      col('msg', safeSql`msg`),
      col('error', safeSql`error`),
    ],
    filterTemplates: AUTH_FILTERS,
    error: AUTH_ERROR,
    warning: AUTH_WARNING,
  },
  [LogsTableName.MULTIGRES]: {
    source: 'multigres_logs',
    error: MULTIGRES_ERROR,
    warning: MULTIGRES_WARNING,
  },
  [LogsTableName.POSTGREST]: {
    source: 'postgrest_logs',
    filterTemplates: { ...COMMON_FILTERS, database: databaseFilter },
  },
  [LogsTableName.SUPAVISOR]: { source: 'supavisor_logs', filterTemplates: SUPAVISOR_FILTERS },
  [LogsTableName.ETL]: { source: 'etl_replication_logs', filterTemplates: ETL_FILTERS },
  [LogsTableName.AUTH_AUDIT]: { source: 'auth_audit_logs' },
  [LogsTableName.REALTIME]: { source: 'realtime_logs' },
  [LogsTableName.STORAGE]: { source: 'storage_logs' },
  [LogsTableName.PGBOUNCER]: { source: 'pgbouncer_logs' },
  [LogsTableName.PG_UPGRADE]: { source: 'pg_upgrade_logs' },
}

// Fallback for filter keys with no template: `log_attributes[key] = value`.
// Drops the clause on non-scalar or un-encodable input.
const resolveUnknownOtelClause = (dotKey: string, value: unknown): SafeLogSqlFragment | null => {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return null
  }
  // OTEL drops the `metadata` root that BigQuery filter keys carry, so a
  // `metadata.function_id` override maps to `log_attributes['function_id']`.
  const attrKey = dotKey.startsWith('metadata.') ? dotKey.slice('metadata.'.length) : dotKey
  try {
    return safeSql`${attr(attrKey)} = ${lit(value)}`
  } catch {
    return null
  }
}

const genOtelWhere = (table: LogsTableName, filters: Filters): SafeLogSqlFragment => {
  const desc = OTEL_SOURCES[table]
  const conditions: SafeLogSqlFragment[] = [safeSql`source = ${lit(desc.source)}`]
  if (desc.baseCondition) conditions.push(desc.baseCondition)
  conditions.push(
    ...buildWhereClauses(
      table,
      filters,
      desc.filterTemplates ?? COMMON_FILTERS,
      resolveUnknownOtelClause
    )
  )
  return safeSql`WHERE ${joinSqlFragments(conditions, ' AND ')}`
}

const genOtelSelectColumns = (table: LogsTableName): SafeLogSqlFragment => {
  const columns: SafeLogSqlFragment[] = [
    safeSql`id`,
    safeSql`timestamp`,
    safeSql`event_message`,
    ...(OTEL_SOURCES[table].columns ?? []),
  ]
  return joinSqlFragments(columns, ', ')
}

export const genDefaultQueryOtel = (
  table: LogsTableName,
  filters: Filters,
  limit: number = 100
): SafeLogSqlFragment => {
  return safeSql`-- Logs Preview Query (otel) [${lit(table)}]
SELECT ${genOtelSelectColumns(table)}
FROM logs
${genOtelWhere(table, filters)}
ORDER BY timestamp DESC
LIMIT ${lit(limit)}`
}

export const genCountQueryOtel = (table: LogsTableName, filters: Filters): SafeLogSqlFragment => {
  return safeSql`-- Logs Count Query (otel) [${lit(table)}]
SELECT count() AS count FROM logs ${genOtelWhere(table, filters)}`
}

// Bucket by minute up to 12h, otherwise by hour (matches BigQuery).
const otelChartTruncFn = (params: LogsEndpointParams): SafeLogSqlFragment => {
  const ite = params.iso_timestamp_end ? dayjs(params.iso_timestamp_end) : dayjs()
  const its = params.iso_timestamp_start ? dayjs(params.iso_timestamp_start) : dayjs()
  const minuteDiff = ite.diff(its, 'minute')
  const hourDiff = ite.diff(its, 'hour')
  if (minuteDiff > 60 * 12) return safeSql`toStartOfHour`
  if (hourDiff > 24 * 3) return safeSql`toStartOfDay`
  return safeSql`toStartOfMinute`
}

export const genChartQueryOtel = (
  table: LogsTableName,
  params: LogsEndpointParams,
  filters: Filters
): SafeLogSqlFragment => {
  const truncFn = otelChartTruncFn(params)
  const desc = OTEL_SOURCES[table]
  const err = desc.error ?? NO_MATCH
  const warn = desc.warning ?? NO_MATCH
  // The time range comes from the endpoint params, not the SQL.
  return safeSql`-- Logs Chart Query (otel) [${lit(table)}]
SELECT
  ${truncFn}(timestamp) AS timestamp,
  countIf(NOT ((${err}) OR (${warn}))) AS ok_count,
  countIf(${err}) AS error_count,
  countIf(${warn}) AS warning_count
FROM logs
${genOtelWhere(table, filters)}
GROUP BY timestamp
ORDER BY timestamp ASC`
}

// Reject non-uuid ids before putting them in the query (injection guard).
export const genSingleLogQueryOtel = (id: string): SafeLogSqlFragment => {
  if (!/^[0-9a-fA-F-]{1,64}$/.test(id)) {
    throw new Error('Invalid logId')
  }
  return safeSql`-- Single Log Query (otel)
SELECT id, timestamp, event_message, source, severity_text, log_attributes
FROM logs
WHERE id = ${lit(id)}
LIMIT 1`
}

// Renderers and the pagination cursor expect a microsecond number.
export const otelTimestampToMicros = (timestamp: unknown): number =>
  parseOtelTimestamp(timestamp).getTime() * 1000

export const mapOtelPreviewRow = (row: Record<string, any>): LogData => {
  return { ...row, timestamp: otelTimestampToMicros(row.timestamp) } as LogData
}

// The api/database detail panels read a nested `metadata` shape, so rebuild it
// from the flat attributes. Other tables use a flat row.
// TODO: edge logs also carry the JWT/apikey keys, so the panel's API key / role
// rows could be rebuilt here later.
const SINGLE_LOG_METADATA: Partial<Record<QueryType, (attrs: Record<string, string>) => Metadata>> =
  {
    api: (attrs) => ({
      request: [
        {
          method: attrs['request.method'] ?? null,
          path: attrs['request.path'] ?? null,
          search: attrs['request.search'] ?? null,
          headers: [{ user_agent: attrs['request.headers.user_agent'] ?? null }],
        },
      ],
      response: [
        {
          status_code: attrs['response.status_code'] ?? null,
          // OTEL uses `sb_error_code`; BigQuery used `x_sb_error_code`. Fall back
          // to the old key so the panel works during the migration.
          headers: [
            {
              x_sb_error_code:
                attrs['response.headers.sb_error_code'] ??
                attrs['response.headers.x_sb_error_code'] ??
                null,
            },
          ],
        },
      ],
    }),
    database: (attrs) => ({
      parsed: [
        {
          hint: attrs['parsed.hint'] ?? null,
          detail: attrs['parsed.detail'] ?? null,
          query: attrs['parsed.query'] ?? null,
        },
      ],
    }),
  }

// OTEL rows come back untyped from the analytics endpoint; validate the shape we
// read instead of casting. log_attributes is a string-keyed string map.
const OtelLogRowSchema = z.object({
  id: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  event_message: z.string().optional(),
  log_attributes: z.record(z.string(), z.string()).optional(),
})

export const mapOtelSingleLogToLegacy = (row: unknown, queryType?: QueryType): LogData => {
  const parsed = OtelLogRowSchema.safeParse(row)
  if (!parsed.success) {
    console.error('Unexpected OTEL log row shape:', parsed.error.message)
    return { id: '', timestamp: 0, event_message: '' }
  }
  const { id = '', timestamp, event_message = '', log_attributes = {} } = parsed.data
  const base: LogData = { id, timestamp: otelTimestampToMicros(timestamp), event_message }

  const buildMetadata = queryType ? SINGLE_LOG_METADATA[queryType] : undefined
  if (buildMetadata) {
    return { ...base, metadata: [buildMetadata(log_attributes)] }
  }
  return { ...base, ...log_attributes }
}
