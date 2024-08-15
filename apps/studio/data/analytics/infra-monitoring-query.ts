import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { get, handleError } from 'data/fetchers'
import type { AnalyticsData, AnalyticsInterval } from './constants'
import { analyticsKeys } from './keys'

export type InfraMonitoringAttribute =
  | 'max_cpu_usage'
  | 'avg_cpu_usage'
  | 'disk_io_budget'
  | 'ram_usage'
  | 'disk_io_consumption'
  | 'swap_usage'

export type InfraMonitoringVariables = {
  projectRef?: string
  attribute: InfraMonitoringAttribute
  startDate?: string
  endDate?: string
  interval?: AnalyticsInterval
  dateFormat?: string
  databaseIdentifier?: string
  modifier?: (x: number) => number
}

export async function getInfraMonitoring(
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1d',
    databaseIdentifier,
  }: InfraMonitoringVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!attribute) throw new Error('Attribute is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('End date is required')

  const { data, error } = await get('/platform/projects/{ref}/infra-monitoring', {
    params: {
      path: { ref: projectRef },
      query: {
        attribute,
        startDate,
        endDate,
        interval,
        databaseIdentifier,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as AnalyticsData
}

export type InfraMonitoringData = Awaited<ReturnType<typeof getInfraMonitoring>>
export type InfraMonitoringError = unknown

export const useInfraMonitoringQuery = <TData = InfraMonitoringData>(
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1d',
    dateFormat = 'DD MMM',
    databaseIdentifier,
    modifier,
  }: InfraMonitoringVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<InfraMonitoringData, InfraMonitoringError, TData> = {}
) =>
  useQuery<InfraMonitoringData, InfraMonitoringError, TData>(
    analyticsKeys.infraMonitoring(projectRef, {
      attribute,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    }),
    ({ signal }) =>
      getInfraMonitoring(
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
