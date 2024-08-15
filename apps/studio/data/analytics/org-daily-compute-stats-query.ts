import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { AnalyticsData } from './constants'
import { analyticsKeys } from './keys'

export type OrgDailyComputeStatsVariables = {
  // API parameters
  orgSlug?: string
  startDate?: string
  endDate?: string
  projectRef?: string
  // Client specific
  dateFormat?: string
  modifier?: (x: number) => number
}

export async function getOrgDailyComputeStats(
  { orgSlug, startDate, endDate, projectRef }: OrgDailyComputeStatsVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Org slug is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('End date is required')

  let endpoint = `/platform/organizations/{slug}/daily-stats/compute?&startDate=${encodeURIComponent(
    startDate
  )}&endDate=${encodeURIComponent(endDate)}`

  if (projectRef) endpoint += `&projectRef=${projectRef}`

  const { data, error } = await get('/platform/organizations/{slug}/daily-stats/compute', {
    params: { path: { slug: orgSlug }, query: { projectRef, startDate, endDate } },
    signal,
  })
  if (error) handleError(error)
  return data as AnalyticsData
}

export type OrgDailyComputeStatsData = Awaited<ReturnType<typeof getOrgDailyComputeStats>>
export type OrgDailyComputeStatsError = ResponseError

export const useOrgDailyComputeStatsQuery = <TData = OrgDailyComputeStatsData>(
  { orgSlug, startDate, endDate, projectRef, dateFormat = 'DD MMM' }: OrgDailyComputeStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgDailyComputeStatsData, OrgDailyComputeStatsError, TData> = {}
) =>
  useQuery<OrgDailyComputeStatsData, OrgDailyComputeStatsError, TData>(
    analyticsKeys.orgDailyComputeStats(orgSlug, { startDate, endDate, projectRef }),
    ({ signal }) => getOrgDailyComputeStats({ orgSlug, startDate, endDate, projectRef }, signal),
    {
      enabled:
        enabled &&
        typeof orgSlug !== 'undefined' &&
        typeof startDate !== 'undefined' &&
        typeof endDate !== 'undefined',

      select(data) {
        return {
          ...data,
          data: data.data.map((x) => {
            return {
              ...x,
              periodStartFormatted: dayjs(x.period_start).format(dateFormat),
            }
          }),
        } as TData
      },
      staleTime: 1000 * 60 * 60, // default good for an hour for now
      ...options,
    }
  )
