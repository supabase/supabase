import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { get, handleError } from 'data/fetchers'
import type { AnalyticsData, AnalyticsInterval } from './constants'
import { analyticsKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

export type InfraMonitoringAttribute =
  | 'max_cpu_usage'
  | 'avg_cpu_usage'
  | 'disk_io_budget'
  | 'ram_usage'
  | 'disk_io_consumption'
  | 'pg_stat_database_num_backends'
  | 'supavisor_connections_active'
  | 'realtime_connections_connected'
  | 'realtime_channel_events'
  | 'realtime_channel_db_events'
  | 'realtime_channel_presence_events'
  | 'realtime_channel_joins'
  | 'realtime_read_authorization_rls_execution_time'
  | 'realtime_write_authorization_rls_execution_time'
  | 'realtime_payload_size'
  | 'realtime_sum_connections_connected'
  | 'realtime_replication_connection_lag'

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

export type InfraMonitoringSeriesMetadata = {
  yAxisLimit: number
  format: string
  total: number
  totalAverage: number
}

export type InfraMonitoringMultiResponse = {
  data: {
    period_start: string
    values: Record<string, string | undefined>
  }[]
  series: Record<string, InfraMonitoringSeriesMetadata>
}

export type InfraMonitoringMultiVariables = Omit<
  InfraMonitoringVariables,
  'attribute' | 'modifier'
> & {
  attributes: InfraMonitoringAttribute[]
}

export async function getInfraMonitoring(
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1h',
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

export async function getInfraMonitoringAttributes(
  {
    projectRef,
    attributes,
    startDate,
    endDate,
    interval = '1h',
    databaseIdentifier,
  }: InfraMonitoringMultiVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!attributes?.length) throw new Error('At least one attribute is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('End date is required')

  const { data, error } = await get('/platform/projects/{ref}/infra-monitoring', {
    params: {
      path: { ref: projectRef },
      // Attributes support is not yet reflected in the generated client types.
      query: {
        attributes,
        startDate,
        endDate,
        interval,
        databaseIdentifier,
      } as any,
    },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as InfraMonitoringMultiResponse
}

export type InfraMonitoringData = Awaited<ReturnType<typeof getInfraMonitoring>>
export type InfraMonitoringError = unknown
export type InfraMonitoringMultiData = Awaited<ReturnType<typeof getInfraMonitoringAttributes>>

export const useInfraMonitoringQuery = <TData = InfraMonitoringData>(
  {
    projectRef,
    attribute,
    startDate,
    endDate,
    interval = '1h',
    dateFormat = 'HH:mm DD MMM',
    databaseIdentifier,
    modifier,
  }: InfraMonitoringVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<InfraMonitoringData, InfraMonitoringError, TData> = {}
) =>
  useQuery<InfraMonitoringData, InfraMonitoringError, TData>({
    queryKey: analyticsKeys.infraMonitoring(projectRef, {
      attribute,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    }),
    queryFn: ({ signal }) =>
      getInfraMonitoring(
        { projectRef, attribute, startDate, endDate, interval, databaseIdentifier },
        signal
      ),
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
    staleTime: 1000 * 60,
    ...options,
  })

export const useInfraMonitoringAttributesQuery = <TData = InfraMonitoringMultiData>(
  {
    projectRef,
    attributes,
    startDate,
    endDate,
    interval = '1h',
    databaseIdentifier,
  }: InfraMonitoringMultiVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<InfraMonitoringMultiData, InfraMonitoringError, TData> = {}
) =>
  useQuery<InfraMonitoringMultiData, InfraMonitoringError, TData>({
    queryKey: analyticsKeys.infraMonitoringGroup(projectRef, {
      attributes,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    }),
    queryFn: ({ signal }) =>
      getInfraMonitoringAttributes(
        { projectRef, attributes, startDate, endDate, interval, databaseIdentifier },
        signal
      ),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      !!attributes?.length &&
      typeof startDate !== 'undefined' &&
      typeof endDate !== 'undefined',
    staleTime: 1000 * 60,
    ...options,
  })
