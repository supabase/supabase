import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { analyticsKeys } from './keys'
import { AnalyticsData } from './constants'

export type InfraMonitoringVariables = {
  projectRef?: string
  attribute?: 'cpu_usage' | 'disk_io_budget' | 'ram_usage'
  startDate?: string
  endDate?: string
  interval?: string
}

export async function getInfraMonitoring(
  { projectRef, attribute, startDate, endDate, interval = '1d' }: InfraMonitoringVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!attribute) throw new Error('Attribute is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('Start date is required')

  const data = await get(
    `${API_URL}/projects/${projectRef}/infra-monitoring?attribute=${attribute}&startDate=${encodeURIComponent(
      startDate
    )}&endDate=${encodeURIComponent(endDate)}&interval=${interval}`,
    { signal }
  )
  if (data.error) throw data.error
  return data as AnalyticsData
}

export type InfraMonitoringData = Awaited<ReturnType<typeof getInfraMonitoring>>
export type InfraMonitoringError = unknown

export const useInfraMonitoringQuery = <TData = InfraMonitoringData>(
  { projectRef, attribute, startDate, endDate, interval = '1d' }: InfraMonitoringVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<InfraMonitoringData, InfraMonitoringError, TData> = {}
) =>
  useQuery<InfraMonitoringData, InfraMonitoringError, TData>(
    analyticsKeys.dailyStats(projectRef, { attribute, startDate, endDate, interval }),
    ({ signal }) =>
      getInfraMonitoring({ projectRef, attribute, startDate, endDate, interval }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useInfraMonitoringPrefetch = ({
  projectRef,
  attribute,
  startDate,
  endDate,
  interval = '1d',
}: InfraMonitoringVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef && attribute && startDate && endDate && interval) {
      client.prefetchQuery(
        analyticsKeys.dailyStats(projectRef, { attribute, startDate, endDate, interval }),
        ({ signal }) =>
          getInfraMonitoring({ projectRef, attribute, startDate, endDate, interval }, signal)
      )
    }
  }, [projectRef])
}
