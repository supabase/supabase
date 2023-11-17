import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AnalyticsData } from './constants'
import { analyticsKeys } from './keys'

export type InfraMonitoringVariables = {
  projectRef?: string
  attribute:
    | 'max_cpu_usage'
    | 'avg_cpu_usage'
    | 'disk_io_budget'
    | 'ram_usage'
    | 'disk_io_consumption'
    | 'swap_usage'
  startDate?: string
  endDate?: string
  interval?: '1m' | '5m' | '10m' | '30m' | '1h' | '1d'
  dateFormat?: string
  modifier?: (x: number) => number
}

export async function getInfraMonitoring(
  { projectRef, attribute, startDate, endDate, interval = '1d' }: InfraMonitoringVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!attribute) throw new Error('Attribute is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('End date is required')

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
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1d',
    dateFormat = 'DD MMM',
    modifier,
  }: InfraMonitoringVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<InfraMonitoringData, InfraMonitoringError, TData> = {}
) =>
  useQuery<InfraMonitoringData, InfraMonitoringError, TData>(
    analyticsKeys.infraMonitoring(projectRef, { attribute, startDate, endDate, interval }),
    ({ signal }) =>
      getInfraMonitoring({ projectRef, attribute, startDate, endDate, interval }, signal),
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
