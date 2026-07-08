import { get, handleError } from '@/data/fetchers'

export type ServiceHealthGranularity = 'day' | 'hour' | 'minute'

export type ServiceHealthServiceData = {
  error: number
  ok: number
  warning: number
  total: number
}

/** Shape of a single result row returned by the service-health endpoint */
export type ServiceHealthResultRow = {
  timestamp: string
  postgres_logs: ServiceHealthServiceData
  auth_logs: ServiceHealthServiceData
  function_edge_logs: ServiceHealthServiceData
  storage_logs: ServiceHealthServiceData
  realtime_logs: ServiceHealthServiceData
  postgrest_logs: ServiceHealthServiceData
  edge_logs: ServiceHealthServiceData
  supavisor_logs: ServiceHealthServiceData
  function_logs: ServiceHealthServiceData
  etl_replication_logs: ServiceHealthServiceData
}

export type ProjectServiceHealthResponse = {
  error?: string | null
  result?: ServiceHealthResultRow[]
}

export type ServiceHealthVariables = {
  projectRef?: string
  startDate?: string
  endDate?: string
  granularity?: ServiceHealthGranularity
}

export async function getServiceHealth(
  { projectRef, startDate, endDate, granularity }: ServiceHealthVariables,
  signal?: AbortSignal
): Promise<ProjectServiceHealthResponse> {
  if (!projectRef) throw new Error('Project ref is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('End date is required')

  const { data, error } = await get('/platform/projects/{ref}/analytics/endpoints/service-health', {
    params: {
      path: { ref: projectRef },
      query: {
        iso_timestamp_start: startDate,
        iso_timestamp_end: endDate,
        granularity,
      },
    },
    signal,
  })

  if (error) handleError(error)

  const result = data as unknown as ProjectServiceHealthResponse
  if (result?.error)
    throw new Error(
      typeof result.error === 'string' ? result.error : 'Failed to fetch service health'
    )

  return result
}
