import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import {
  getAuthServiceFlowQuery,
  getEdgeFunctionServiceFlowQuery,
  getPostgresServiceFlowQuery,
  getPostgrestServiceFlowQuery,
  getStorageServiceFlowQuery,
} from 'components/interfaces/UnifiedLogs/Queries/ServiceFlowQueries/ServiceFlow.sql'
import { QuerySearchParamsType } from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { logsKeys } from './keys'
import {
  getUnifiedLogsISOStartEnd,
  UNIFIED_LOGS_QUERY_OPTIONS,
} from './unified-logs-infinite-query'

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
  { projectRef, logId, type, search }: UnifiedLogInspectionVariables,
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

  // Use the same timestamp logic as the main unified logs query
  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

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

export type UnifiedLogInspectionData = Awaited<ReturnType<typeof getUnifiedLogInspection>>
export type UnifiedLogInspectionError = ResponseError

export const useUnifiedLogInspectionQuery = <TData = UnifiedLogInspectionData>(
  { projectRef, logId, type, search }: UnifiedLogInspectionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UnifiedLogInspectionData, UnifiedLogInspectionError, TData> = {}
) =>
  useQuery<UnifiedLogInspectionData, UnifiedLogInspectionError, TData>(
    logsKeys.serviceFlow(projectRef, search, logId),
    ({ signal }) => getUnifiedLogInspection({ projectRef, logId, type, search }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
