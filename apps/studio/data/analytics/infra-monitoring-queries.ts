import { useMemo } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

import dayjs from 'dayjs'

import type { AnalyticsData, AnalyticsInterval } from './constants'
import type {
  InfraMonitoringAttribute,
  InfraMonitoringMultiResponse,
  InfraMonitoringSingleResponse,
} from './infra-monitoring-query'
import {
  InfraMonitoringMultiData,
  InfraMonitoringError,
  useInfraMonitoringAttributesQuery,
} from './infra-monitoring-query'

// TODO(raulb): Remove isMultiResponse type guard once API always returns multi-attribute format.
/**
 * Type guard to check if response is the multi-attribute format.
 * Multi-format has `series` property, single-format has metadata directly on response.
 */
function isMultiResponse(
  response: InfraMonitoringMultiData
): response is InfraMonitoringMultiResponse {
  return 'series' in response
}

const DEFAULT_DATE_FORMAT = 'HH:mm DD MMM'

type InfraQueryResult = Pick<
  UseQueryResult<AnalyticsData, InfraMonitoringError>,
  'data' | 'error' | 'isError' | 'isFetching' | 'isLoading' | 'status'
>

export function useInfraMonitoringQueries(
  attributes: InfraMonitoringAttribute[],
  ref: string | string[] | undefined,
  startDate: string,
  endDate: string,
  interval: AnalyticsInterval,
  databaseIdentifier: string | undefined,
  data: any,
  isVisible: boolean
) {
  const shouldFetch = data === undefined && isVisible
  const hasAttributes = attributes.length > 0

  const query = useInfraMonitoringAttributesQuery(
    {
      projectRef: ref as string,
      attributes,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    },
    { enabled: shouldFetch && hasAttributes }
  )

  const seriesByAttribute = useMemo(() => {
    if (!query.data) return undefined
    return mapResponseToAnalyticsData(query.data, attributes)
  }, [query.data, attributes])

  if (!hasAttributes) {
    return []
  }

  return attributes.map<InfraQueryResult>((attribute) => ({
    data: seriesByAttribute?.[attribute],
    error: query.error,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    status: query.status,
  }))
}

export function mapResponseToAnalyticsData(
  response: InfraMonitoringMultiData,
  attributes: InfraMonitoringAttribute[],
  dateFormat: string = DEFAULT_DATE_FORMAT
): Record<string, AnalyticsData> {
  // Handle multi-attribute response format
  if (isMultiResponse(response)) {
    return attributes.reduce<Record<string, AnalyticsData>>((acc, attribute) => {
      const metadata = response.series?.[attribute]
      if (!metadata) return acc

      const dataPoints = response.data.map((point) => {
        const value = point.values?.[attribute]
        return {
          period_start: point.period_start,
          periodStartFormatted: dayjs(point.period_start).format(dateFormat),
          [attribute]: value === undefined ? 0 : Number(value),
        }
      })

      acc[attribute] = {
        data: dataPoints,
        format: metadata.format,
        total: metadata.total,
        yAxisLimit: metadata.yAxisLimit,
      }

      return acc
    }, {})
  }

  // TODO(raulb): Remove single-attribute response handling once API always returns multi-attribute format.
  // Handle single-attribute response format
  // API returns this format when only 1 attribute is requested
  const singleResponse = response as InfraMonitoringSingleResponse
  const attribute = attributes[0]
  if (!attribute) return {}

  const dataPoints = singleResponse.data.map((point) => {
    const value = point[attribute]
    return {
      period_start: point.period_start,
      periodStartFormatted: dayjs(point.period_start).format(dateFormat),
      [attribute]: value === undefined ? 0 : Number(value),
    }
  })

  return {
    [attribute]: {
      data: dataPoints,
      format: singleResponse.format,
      total: singleResponse.total,
      yAxisLimit: singleResponse.yAxisLimit,
    },
  }
}

/** @deprecated Use mapResponseToAnalyticsData instead */
export const mapMultiResponseToAnalyticsData = mapResponseToAnalyticsData
