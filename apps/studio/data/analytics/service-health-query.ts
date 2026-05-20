import { useQuery } from '@tanstack/react-query'
import { paths } from 'api-types'

import { analyticsKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { UseCustomQueryOptions } from '@/types'

export type ServiceHealthGranularity = 'day' | 'hour' | 'minute'

export type ServiceHealthRow = {
  timestamp: string | number
  ok_count: number
  warning_count: number
  error_count: number
}

export type ProjectServiceHealthResponse = NonNullable<
  paths['/platform/projects/{ref}/analytics/endpoints/service-health']['get']['responses']['200']['content']['application/json']
>

export type ServiceHealthVariables = {
  projectRef?: string
  startDate?: string
  endDate?: string
  granularity?: ServiceHealthGranularity
  lql?: string
  sql?: string
}

export async function getServiceHealth(
  { projectRef, startDate, endDate, granularity, lql, sql }: ServiceHealthVariables,
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
        lql,
        sql,
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

export type ServiceHealthError = unknown
export type ServiceHealthData = Awaited<ReturnType<typeof getServiceHealth>>

export const useServiceHealthQuery = <TData = ServiceHealthData>(
  { projectRef, startDate, endDate, granularity, lql, sql }: ServiceHealthVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ServiceHealthData, ServiceHealthError, TData> = {}
) =>
  useQuery<ServiceHealthData, ServiceHealthError, TData>({
    queryKey: analyticsKeys.serviceHealth(projectRef, { startDate, endDate, granularity, lql }),
    queryFn: ({ signal }) =>
      getServiceHealth({ projectRef, startDate, endDate, granularity, lql, sql }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof startDate !== 'undefined' &&
      typeof endDate !== 'undefined',
    staleTime: 1000 * 60,
    ...options,
  })
