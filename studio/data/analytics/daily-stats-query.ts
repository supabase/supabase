import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { analyticsKeys } from './keys'
import { AnalyticsData } from './constants'

export type DailyStatsVariables = {
  projectRef?: string
  attribute?:
    | 'total_realtime_egress'
    | 'total_realtime_requests'
    | 'total_realtime_ingress'
    | 'total_rest_ingress'
    | 'total_rest_egress'
    | 'total_rest_requests'
    | 'total_rest_get_requests'
    | 'total_rest_post_requests'
    | 'total_rest_patch_requests'
    | 'total_rest_delete_requests'
    | 'total_rest_options_requests'
    | 'total_auth_billing_period_mau'
    | 'total_auth_billing_period_sso_mau'
    | 'total_auth_ingress'
    | 'total_auth_egress'
    | 'total_auth_requests'
    | 'total_auth_get_requests'
    | 'total_auth_post_requests'
    | 'total_auth_patch_requests'
    | 'total_auth_delete_requests'
    | 'total_auth_options_requests'
    | 'total_storage_ingress'
    | 'total_storage_egress'
    | 'total_storage_image_render_count'
    | 'total_storage_requests'
    | 'total_storage_get_requests'
    | 'total_storage_post_requests'
    | 'total_storage_patch_requests'
    | 'total_storage_delete_requests'
    | 'total_storage_options_requests'
    | 'total_ingress'
    | 'total_egress'
    | 'total_requests'
    | 'total_get_requests'
    | 'total_post_requests'
    | 'total_patch_requests'
    | 'total_delete_requests'
    | 'total_options_requests'
  startDate?: string
  endDate?: string
  interval?: string
}

export async function getDailyStats(
  { projectRef, attribute, startDate, endDate, interval = '1d' }: DailyStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!attribute) throw new Error('Attribute is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('Start date is required')

  const data = await get(
    `${API_URL}/projects/${projectRef}/daily-stats?attribute=${attribute}&startDate=${encodeURIComponent(
      startDate
    )}&endDate=${encodeURIComponent(endDate)}&interval=${interval}`,
    { signal }
  )
  if (data.error) throw data.error
  return data as AnalyticsData
}

export type DailyStatsData = Awaited<ReturnType<typeof getDailyStats>>
export type DailyStatsError = unknown

export const useDailyStatsQuery = <TData = DailyStatsData>(
  { projectRef, attribute, startDate, endDate, interval = '1d' }: DailyStatsVariables,
  { enabled = true, ...options }: UseQueryOptions<DailyStatsData, DailyStatsError, TData> = {}
) =>
  useQuery<DailyStatsData, DailyStatsError, TData>(
    analyticsKeys.dailyStats(projectRef, { attribute, startDate, endDate, interval }),
    ({ signal }) => getDailyStats({ projectRef, attribute, startDate, endDate, interval }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useDailyStatsPrefetch = ({
  projectRef,
  attribute,
  startDate,
  endDate,
  interval = '1d',
}: DailyStatsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef && attribute && startDate && endDate && interval) {
      client.prefetchQuery(
        analyticsKeys.dailyStats(projectRef, { attribute, startDate, endDate, interval }),
        ({ signal }) =>
          getDailyStats({ projectRef, attribute, startDate, endDate, interval }, signal)
      )
    }
  }, [projectRef])
}
