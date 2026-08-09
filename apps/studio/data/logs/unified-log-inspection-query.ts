import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import {
  aggregateFunctionLogs,
  flattenOtelInspectionRow,
  type OtelLogRow,
} from './otel-inspection.utils'
import { analyticsLiteral as lit, safeSql, type SafeLogSqlFragment } from './safe-analytics-sql'
import {
  getUnifiedLogsISOStartEnd,
  UNIFIED_LOGS_QUERY_OPTIONS,
} from './unified-logs-infinite-query'
import {
  getAuthServiceFlowQuery,
  getEdgeFunctionServiceFlowQuery,
  getPostgresServiceFlowQuery,
  getPostgrestServiceFlowQuery,
  getStorageServiceFlowQuery,
} from '@/components/interfaces/UnifiedLogs/Queries/ServiceFlowQueries/ServiceFlow.sql'
import { LOG_TYPE_TO_SOURCE } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

// Service flow types - subset of LOG_TYPES that support service flows
export const SERVICE_FLOW_TYPES = [
  'postgrest',
  'auth',
  'edge-function',
  'storage',
  'postgres',
] as const

export type ServiceFlowType = (typeof SERVICE_FLOW_TYPES)[number]

// The logs table's primary key is (project, source, timestamp) — filtering on
// source narrows the sorted range ClickHouse has to scan before the timestamp
// bound even applies, so it matters for performance, not just correctness.
// Values are drawn from LOG_TYPE_TO_SOURCE (shared with LOG_TYPE_CONDITION in
// UnifiedLogs.queries.ts) so there's one source of truth for the type -> source
// mapping; only the key spelling differs ('edge-function' vs 'edge function').
const SERVICE_FLOW_TYPE_SOURCE: Record<ServiceFlowType, SafeLogSqlFragment> = {
  postgrest: lit(LOG_TYPE_TO_SOURCE.postgrest),
  auth: lit(LOG_TYPE_TO_SOURCE.auth),
  'edge-function': lit(LOG_TYPE_TO_SOURCE['edge function']),
  storage: lit(LOG_TYPE_TO_SOURCE.storage),
  postgres: lit(LOG_TYPE_TO_SOURCE.postgres),
}

export type UnifiedLogInspectionVariables = {
  projectRef?: string
  logId?: string
  type?: ServiceFlowType
  search: QuerySearchParamsType
  useOtel?: boolean
  /**
   * The selected row's own timestamp (ms since epoch), when known. A single log
   * is always looked up by `id`, so we can bound the query tightly around this
   * timestamp instead of the (potentially much wider) selected search range.
   */
  logTimestampMs?: number | null
}

// The row's timestamp is the exact stored value (parsed from the same
// `timestamp` column), not an approximate clock reading, so this only needs to
// absorb millisecond-vs-microsecond rounding — not real clock skew.
const INSPECTION_WINDOW_MS = 60 * 1000

function getInspectionISOStartEnd(
  search: QuerySearchParamsType,
  logTimestampMs: number | null | undefined
) {
  if (typeof logTimestampMs === 'number' && Number.isFinite(logTimestampMs)) {
    return {
      isoTimestampStart: new Date(logTimestampMs - INSPECTION_WINDOW_MS).toISOString(),
      isoTimestampEnd: new Date(logTimestampMs + INSPECTION_WINDOW_MS).toISOString(),
    }
  }
  return getUnifiedLogsISOStartEnd(search)
}

export type UnifiedLogInspectionResponse = {
  result: UnifiedLogInspectionEntry[]
}

export interface UnifiedLogInspectionEntry {
  id: string
  timestamp: string
  service_name: string
  method: string
  path: string
  host: string
  status_code: string
  level: string
  response_time_ms?: number
  auth_user?: string | null
  api_role?: string | null
  service_specific_data: Record<string, any>

  // Request data
  'request.path'?: string
  'request.host'?: string
  'request.method'?: string
  'request.url'?: string

  // Response data
  'response.origin_time'?: number
  'response.content_type'?: string
  'response.cache_status'?: string

  // API Key Authentication
  'apikey.role'?: 'anon' | 'service_role' | '<invalid>' | '<unrecognized>' | null
  'apikey.prefix'?: string
  'apikey.error'?: string

  // User Authorization
  'authorization.role'?: 'authenticated' | 'anon' | null
  user_id?: string
  user_email?: string

  // Cloudflare Network Info
  cf_ray?: string
  cf_country?: string
  cf_datacenter?: string
  client_ip?: string

  // Client location data
  'client.continent'?: string
  'client.country'?: string
  'client.city'?: string
  'client.region'?: string
  'client.region_code'?: string
  'client.latitude'?: number
  'client.longitude'?: number
  'client.timezone'?: string

  // Network data
  'network.protocol'?: string
  'network.datacenter'?: string

  // Request headers
  'headers.user_agent'?: string
  'headers.x_client_info'?: string
  'headers.x_forwarded_proto'?: string
  'headers.x_real_ip'?: string

  // JWT data
  'jwt.apikey_role'?: string
  'jwt.apikey_algorithm'?: string
  'jwt.apikey_expires_at'?: string
  'jwt.apikey_issuer'?: string
  'jwt.apikey_signature_prefix'?: string
  'jwt.auth_role'?: string
  'jwt.auth_algorithm'?: string
  'jwt.auth_expires_at'?: string
  'jwt.auth_issuer'?: string
  'jwt.auth_signature_prefix'?: string

  // Raw data
  raw_log_data?: any
}

export async function getUnifiedLogInspection(
  {
    projectRef,
    logId,
    type,
    search,
    useOtel = false,
    logTimestampMs,
  }: UnifiedLogInspectionVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!logId) {
    throw new Error('logId is required')
  }
  if (!type) {
    throw new Error('type is required')
  }

  const { isoTimestampStart, isoTimestampEnd } = getInspectionISOStartEnd(search, logTimestampMs)

  if (!useOtel) {
    let sql: SafeLogSqlFragment
    switch (type) {
      case 'postgrest':
        sql = getPostgrestServiceFlowQuery(logId)
        break
      case 'auth':
        sql = getAuthServiceFlowQuery(logId)
        break
      case 'edge-function':
        sql = getEdgeFunctionServiceFlowQuery(logId)
        break
      case 'storage':
        sql = getStorageServiceFlowQuery(logId)
        break
      case 'postgres':
        sql = getPostgresServiceFlowQuery(logId)
        break
      default:
        throw new Error('Invalid type')
    }

    const data = await executeAnalyticsSql({
      projectRef,
      endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all',
      sql,
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: isoTimestampEnd,
      signal,
    })

    return data as unknown as UnifiedLogInspectionResponse
  }

  // OTEL path: the endpoint stores all log sources in a single `logs` table
  // and exposes the rich detail through the `log_attributes` Map. We just
  // fetch the single row by id and flatten its attributes onto the response
  // so existing panel components that read `enrichedData['request.path']`
  // etc. keep working without per service flow SQL.
  //
  // logId comes from the row data we fetched (a uuid-shaped value), but it
  // ultimately originates from a URL query parameter. Reject anything that
  // isn't a plain uuid before interpolating it into SQL so a crafted id
  // can't break out of the string literal.
  if (!/^[0-9a-fA-F-]{1,64}$/.test(logId)) {
    throw new Error('Invalid logId')
  }
  const sql = safeSql`-- unified logs: inspect single log by id
SELECT id, timestamp, source, event_message, severity_text, log_attributes
FROM logs
WHERE id = ${lit(logId)} AND source = ${SERVICE_FLOW_TYPE_SOURCE[type]}
LIMIT 1
`

  const rawData = await executeAnalyticsSql({
    projectRef,
    endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
    sql,
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
    signal,
  })

  const otelData = rawData as { result?: OtelLogRow[] } | undefined
  const row = otelData?.result?.[0]
  if (!row) {
    return { result: [] }
  }

  const entry = flattenOtelInspectionRow(row) as UnifiedLogInspectionEntry & Record<string, unknown>

  // For edge function rows, fetch and aggregate the related `function_logs`
  // (the per-execution console.log output) — this is the only legitimate
  // cross-source join in the legacy BigQuery service-flow queries.
  if (row.source === 'function_edge_logs') {
    const executionId = row.log_attributes?.['execution_id'] ?? row.log_attributes?.['request_id']
    if (typeof executionId === 'string' && /^[0-9a-fA-F-]{1,64}$/.test(executionId)) {
      const fnSql = safeSql`-- unified logs: edge function console logs for execution
SELECT id, timestamp, source, event_message, severity_text, log_attributes
FROM logs
WHERE source = 'function_logs' AND log_attributes['execution_id'] = ${lit(executionId)}
ORDER BY timestamp ASC
LIMIT 100
`

      try {
        const fnData = await executeAnalyticsSql({
          projectRef,
          endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
          sql: fnSql,
          iso_timestamp_start: isoTimestampStart,
          iso_timestamp_end: isoTimestampEnd,
          signal,
        })
        const fnRows = ((fnData as { result?: OtelLogRow[] } | undefined)?.result ??
          []) as OtelLogRow[]
        Object.assign(entry, aggregateFunctionLogs(fnRows))
      } catch {
        // function logs are supplementary; silently ignore fetch errors
      }
    }
  }

  return { result: [entry as UnifiedLogInspectionEntry] }
}

export type UnifiedLogInspectionData = Awaited<ReturnType<typeof getUnifiedLogInspection>>
export type UnifiedLogInspectionError = ResponseError

export const useUnifiedLogInspectionQuery = <TData = UnifiedLogInspectionData>(
  { projectRef, logId, type, search, logTimestampMs }: UnifiedLogInspectionVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<UnifiedLogInspectionData, UnifiedLogInspectionError, TData> = {}
) => {
  const useOtel = !!useFlag('otelUnifiedLogs')
  return useQuery<UnifiedLogInspectionData, UnifiedLogInspectionError, TData>({
    queryKey: [...logsKeys.serviceFlow(projectRef, search, logId), { otel: useOtel }],
    queryFn: ({ signal }) =>
      getUnifiedLogInspection({ projectRef, logId, type, search, useOtel, logTimestampMs }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
