import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { AnalyticsData } from './constants'
import { analyticsKeys } from './keys'

export type DailyStatsVariables = {
  projectRef?: string
  attribute:
    | 'total_db_egress_bytes'
    | 'total_db_size_bytes'
    | 'total_egress_modified'

    // Realtime
    | 'total_realtime_ingress'
    | 'total_realtime_egress'
    | 'total_realtime_message_count'
    | 'total_realtime_peak_connection'
    | 'total_realtime_requests'
    | 'total_realtime_get_requests'
    | 'total_realtime_post_requests'
    | 'total_realtime_patch_requests'
    | 'total_realtime_delete_requests'
    | 'total_realtime_options_requests'

    // Rest
    | 'total_rest_ingress'
    | 'total_rest_egress'
    | 'total_rest_requests'
    | 'total_rest_get_requests'
    | 'total_rest_post_requests'
    | 'total_rest_patch_requests'
    | 'total_rest_delete_requests'
    | 'total_rest_options_requests'

    // Auth
    | 'total_auth_billing_period_mau'
    | 'total_auth_billing_period_sso_mau'
    | 'total_auth_ingress'
    | 'total_auth_egress'
    | 'total_auth_texts'
    | 'total_auth_users'
    | 'total_auth_emails'
    | 'total_auth_requests'
    | 'total_auth_get_requests'
    | 'total_auth_post_requests'
    | 'total_auth_patch_requests'
    | 'total_auth_delete_requests'
    | 'total_auth_options_requests'

    // Storage
    | 'total_storage_ingress'
    | 'total_storage_egress'
    | 'total_storage_size_bytes'
    | 'total_storage_image_render_count'
    | 'total_storage_requests'
    | 'total_storage_get_requests'
    | 'total_storage_post_requests'
    | 'total_storage_patch_requests'
    | 'total_storage_delete_requests'
    | 'total_storage_options_requests'

    // Edge functions
    | 'total_func_count'
    | 'total_func_invocations'
    | 'total_func_exec_time_ms'
    | 'total_func_ingress'
    | 'total_func_egress'

    // Combined
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
  dateFormat?: string
  modifier?: (x: number) => number
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
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1d',
    dateFormat = 'DD MMM',
    modifier,
  }: DailyStatsVariables,
  { enabled = true, ...options }: UseQueryOptions<DailyStatsData, DailyStatsError, TData> = {}
) =>
  useQuery<DailyStatsData, DailyStatsError, TData>(
    analyticsKeys.dailyStats(projectRef, { attribute, startDate, endDate, interval }),
    ({ signal }) => getDailyStats({ projectRef, attribute, startDate, endDate, interval }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof attribute !== 'undefined' &&
        typeof startDate !== 'undefined' &&
        typeof endDate !== 'undefined',

      select(data) {
        const noDataYet = data.data[0]?.id === undefined

        // [Joshen] Ideally handled by API, like infra-monitoring
        if (noDataYet) {
          const days = dayjs(endDate).diff(dayjs(startDate), 'days')
          const tempArray = new Array(days).fill(0)
          const mockData = tempArray.map((x, idx) => {
            return {
              loopId: idx,
              period_start: dayjs(startDate).add(idx, 'day').format('DD MMM YYYY'),
              periodStartFormatted: dayjs(startDate).add(idx, 'day').format(dateFormat),
              [attribute]: 0,
            }
          })
          return { ...data, data: mockData, hasNoData: true } as TData
        } else {
          return {
            ...data,
            hasNoData: false,
            data: data.data.map((x) => {
              return {
                ...x,
                [attribute]:
                  modifier !== undefined ? modifier(Number(x[attribute])) : Number(x[attribute]),
                periodStartFormatted: dayjs(x.period_start).format(dateFormat),
              }
            }),
          } as TData
        }
      },
      staleTime: 1000 * 60 * 60, // default good for an hour for now
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
