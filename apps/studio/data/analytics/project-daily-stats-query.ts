import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { get, handleError } from 'data/fetchers'
import type { AnalyticsData } from './constants'
import { analyticsKeys } from './keys'

export type ProjectDailyStatsAttribute =
  | 'max_cpu_usage'
  | 'avg_cpu_usage'
  | 'disk_io_budget'
  | 'ram_usage'
  | 'disk_io_consumption'
  | 'swap_usage'

export type ProjectDailyStatsInterval = '1m' | '5m' | '10m' | '30m' | '1h' | '1d'

export type ProjectDailyStatsVariables = {
  projectRef?: string
  attribute: ProjectDailyStatsAttribute
  startDate?: string
  endDate?: string
  interval?: ProjectDailyStatsInterval
  dateFormat?: string
  databaseIdentifier?: string
  modifier?: (x: number) => number
}

export async function getProjectDailyStats(
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1d',
    databaseIdentifier,
  }: ProjectDailyStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!attribute) throw new Error('Attribute is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('End date is required')

  const { data, error } = await get('/platform/projects/{ref}/daily-stats', {
    params: {
      path: { ref: projectRef },
      query: {
        attribute,
        startDate,
        endDate,
        interval,
        // [Joshen] TODO: Once API support is ready
        // databaseIdentifier,
      },
    },
    signal,
  })

  if (error) throw handleError(error)
  return data as unknown as AnalyticsData
}

export type ProjectDailyStatsData = Awaited<ReturnType<typeof getProjectDailyStats>>
export type ProjectDailyStatsError = unknown

export const useProjectDailyStatsQuery = <TData = ProjectDailyStatsData>(
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1d',
    dateFormat = 'DD MMM',
    databaseIdentifier,
    modifier,
  }: ProjectDailyStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectDailyStatsData, ProjectDailyStatsError, TData> = {}
) =>
  useQuery<ProjectDailyStatsData, ProjectDailyStatsError, TData>(
    analyticsKeys.infraMonitoring(projectRef, {
      attribute,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    }),
    ({ signal }) =>
      getProjectDailyStats(
        { projectRef, attribute, startDate, endDate, interval, databaseIdentifier },
        signal
      ),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof attribute !== 'undefined' &&
        typeof startDate !== 'undefined' &&
        typeof endDate !== 'undefined',
      select(data) {
        return {
          ...data,
          data: data.data.map((x) => {
            return {
              ...x,
              [attribute]:
                modifier !== undefined ? modifier(Number(x[attribute])) : Number(x[attribute]),
              periodStartFormatted: dayjs(x.period_start).format(dateFormat),
            }
          }),
        } as TData
      },
      staleTime: 1000 * 60, // default good for a minute
      ...options,
    }
  )
