import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { post, handleError } from 'data/fetchers'
import { getPostgrestServiceFlowQuery } from 'components/interfaces/UnifiedLogs/Queries/ServiceFlowQueries/ServiceFlow.sql'
import { QuerySearchParamsType } from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { ResponseError } from 'types'
import { logsKeys } from './keys'
import { getUnifiedLogsISOStartEnd } from './unified-logs-infinite-query'

export type UnifiedLogInspectionVariables = {
  projectRef?: string
  logId?: string
  type?: 'postgrest'
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
}

export async function getUnifiedLogInspection(
  { projectRef, logId, type, search }: UnifiedLogInspectionVariables,
  signal?: AbortSignal
) {
  console.log('🔍 getUnifiedLogInspection called with:', {
    projectRef,
    logId,
    type,
    search,
  })

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
    default:
      throw new Error('Invalid type')
  }

  // Use the same timestamp logic as the main unified logs query
  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

  console.log('🔍 Generated SQL:', sql)
  console.log('🔍 API call parameters:', {
    projectRef,
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
  })

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
    console.error('🔍 Service Flow API Error:', error)
    handleError(error)
  }

  console.log('🔍 Service Flow API Response:', data)

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
      ...options,
    }
  )
