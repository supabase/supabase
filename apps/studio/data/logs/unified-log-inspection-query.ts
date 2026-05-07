import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { logsKeys } from './keys'
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
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from '@/data/fetchers'
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

export type UnifiedLogInspectionVariables = {
  projectRef?: string
  logId?: string
  type?: ServiceFlowType
  search: QuerySearchParamsType
  useOtel?: boolean
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
  { projectRef, logId, type, search, useOtel = false }: UnifiedLogInspectionVariables,
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

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

  if (!useOtel) {
    let sql = ''
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

    const { data, error } = await post('/platform/projects/{ref}/analytics/endpoints/logs.all', {
      params: { path: { ref: projectRef } },
      body: {
        iso_timestamp_start: isoTimestampStart,
        iso_timestamp_end: isoTimestampEnd,
        sql: sql,
      },
      signal,
    })

    if (error) {
      handleError(error)
    }

    return data as unknown as UnifiedLogInspectionResponse
  }

  // OTEL path: the endpoint stores all log sources in a single `logs` table
  // and exposes the rich detail through the `log_attributes` Map. We just
  // fetch the single row by id and flatten its attributes onto the response
  // so existing panel components that read `enrichedData['request.path']`
  // etc. keep working without per service flow SQL.
  const sql = `
SELECT id, timestamp, source, event_message, severity_text, log_attributes
FROM logs
WHERE id = '${logId}'
LIMIT 1
`.trim()

  const { data, error } = await post('/platform/projects/{ref}/analytics/endpoints/logs.all.otel', {
    params: { path: { ref: projectRef } },
    body: {
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: isoTimestampEnd,
      sql,
    },
    signal,
  })

  if (error) {
    handleError(error)
  }

  const row: any = (data as any)?.result?.[0]
  if (!row) {
    return { result: [] }
  }

  const attrs: Record<string, any> = row.log_attributes ?? {}
  const entry: UnifiedLogInspectionEntry = {
    ...attrs,
    id: row.id,
    timestamp: row.timestamp,
    service_name: row.source ?? '',
    method: attrs['request.method'] ?? '',
    path: attrs['request.path'] ?? '',
    host: attrs['request.host'] ?? '',
    status_code: attrs['response.status_code'] ?? '',
    level: row.severity_text ?? '',
    cf_ray: attrs['request.headers.cf_ray'],
    cf_country: attrs['request.cf.country'],
    cf_datacenter: attrs['request.cf.colo'],
    client_ip: attrs['request.headers.cf_connecting_ip'] ?? attrs['request.headers.x_real_ip'],
    raw_log_data: row,
    service_specific_data: {},
  }

  return { result: [entry] }
}

export type UnifiedLogInspectionData = Awaited<ReturnType<typeof getUnifiedLogInspection>>
export type UnifiedLogInspectionError = ResponseError

export const useUnifiedLogInspectionQuery = <TData = UnifiedLogInspectionData>(
  { projectRef, logId, type, search }: UnifiedLogInspectionVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<UnifiedLogInspectionData, UnifiedLogInspectionError, TData> = {}
) => {
  const useOtel = !!useFlag('otelUnifiedLogs')
  return useQuery<UnifiedLogInspectionData, UnifiedLogInspectionError, TData>({
    queryKey: [...logsKeys.serviceFlow(projectRef, search, logId), { otel: useOtel }],
    queryFn: ({ signal }) =>
      getUnifiedLogInspection({ projectRef, logId, type, search, useOtel }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
