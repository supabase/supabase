import { useQuery } from '@tanstack/react-query'
import { paths } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { UseCustomQueryOptions } from 'types'

import type { AnalyticsInterval } from './constants'
import { analyticsKeys } from './keys'

export type InfraMonitoringAttribute = NonNullable<
  paths['/platform/projects/{ref}/infra-monitoring']['get']['parameters']['query']['attributes']
>[number]

export type InfraMonitoringSeriesMetadata = {
  yAxisLimit: number
  format: string
  total: number
  totalAverage: number | string
}

// TODO(raulb): Remove InfraMonitoringSingleResponse once API always returns multi-attribute format.
// Single-attribute response shape (when API receives 1 attribute)
export type InfraMonitoringSingleResponse = InfraMonitoringSeriesMetadata & {
  data: {
    period_start: string
    [attribute: string]: string | undefined
  }[]
}

// Multi-attribute response shape (when API receives 2+ attributes)
export type InfraMonitoringMultiResponse = {
  data: {
    period_start: string
    values: Record<string, string | undefined>
  }[]
  series: Record<string, InfraMonitoringSeriesMetadata>
}

// TODO(raulb): Simplify to just InfraMonitoringMultiResponse once API always returns multi-attribute format.
// API returns different shapes based on attribute count
export type InfraMonitoringResponse = InfraMonitoringSingleResponse | InfraMonitoringMultiResponse

type InfraMonitoringInterval = AnalyticsInterval | '2m'

export type InfraMonitoringMultiVariables = {
  projectRef?: string
  attributes: InfraMonitoringAttribute[]
  startDate?: string
  endDate?: string
  interval?: InfraMonitoringInterval
  databaseIdentifier?: string
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

  // Backend doesn't support 2m granularity, so request 1m and aggregate in frontend
  const is2MinInterval = interval === '2m'
  const requestInterval: AnalyticsInterval = is2MinInterval ? '1m' : (interval as AnalyticsInterval)

  const { data, error } = await get('/platform/projects/{ref}/infra-monitoring', {
    params: {
      path: { ref: projectRef },
      // Attributes support is not yet reflected in the generated client types.
      query: {
        attributes,
        startDate,
        endDate,
        interval: requestInterval,
        databaseIdentifier,
      } as any,
    },
    signal,
  })

  if (error) handleError(error)

  const response = data as unknown as InfraMonitoringResponse & { _originalInterval?: '2m' }
  if (is2MinInterval) {
    response._originalInterval = '2m'
  }

  return response
}

export type InfraMonitoringError = unknown
export type InfraMonitoringMultiData = Awaited<ReturnType<typeof getInfraMonitoringAttributes>>

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
