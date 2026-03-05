import { useMemo } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

import dayjs from 'dayjs'

import type { AnalyticsData, AnalyticsInterval, DataPoint } from './constants'
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
  data: unknown,
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

type AggregatedBucket = {
  period_start: string
  periodStartFormatted: string
  _counts: Record<string, number>
  [key: string]: string | number | Record<string, number>
}

type DataPointWithFormatted = DataPoint & {
  periodStartFormatted: string
}

export const aggregate1MinTo2Min = (dataPoints: DataPoint[]): DataPointWithFormatted[] => {
  const aggregated = new Map<string, AggregatedBucket>()
  const valueKeys = new Set<string>()

  // Collect all value keys
  dataPoints.forEach((point) => {
    Object.keys(point).forEach((key) => {
      if (
        key !== 'period_start' &&
        key !== 'periodStartFormatted' &&
        typeof point[key] === 'number'
      ) {
        valueKeys.add(key)
      }
    })
  })

  // Aggregate by 2min buckets (average the 1min values)
  dataPoints.forEach((point) => {
    const timestamp = dayjs(point.period_start)
    const twoMinBucket = timestamp.startOf('minute').subtract(timestamp.minute() % 2, 'minute')
    const bucketKey = twoMinBucket.toISOString()

    if (!aggregated.has(bucketKey)) {
      const initialBucket: AggregatedBucket = {
        period_start: bucketKey,
        periodStartFormatted: twoMinBucket.format('HH:mm DD MMM'),
        _counts: Object.fromEntries(Array.from(valueKeys).map((key) => [key, 0])),
      }
      // Initialize all value keys to 0
      valueKeys.forEach((key) => {
        initialBucket[key] = 0
      })
      aggregated.set(bucketKey, initialBucket)
    }

    const bucket = aggregated.get(bucketKey)!
    valueKeys.forEach((key) => {
      const value = point[key]
      if (typeof value === 'number') {
        const currentValue = typeof bucket[key] === 'number' ? bucket[key] : 0
        bucket[key] = currentValue + value
        bucket._counts[key] = (bucket._counts[key] || 0) + 1
      }
    })
  })

  // Calculate averages
  const result: DataPointWithFormatted[] = Array.from(aggregated.values()).map((bucket) => {
    const { _counts, period_start, periodStartFormatted, ...rest } = bucket
    const averaged: DataPointWithFormatted = {
      period_start,
      periodStartFormatted,
    }
    valueKeys.forEach((key) => {
      if (_counts[key] > 0) {
        const restValue = rest[key]
        averaged[key] = typeof restValue === 'number' ? restValue / _counts[key] : 0
      } else {
        averaged[key] = typeof rest[key] === 'number' ? rest[key] : 0
      }
    })
    return averaged
  })

  return result.sort((a, b) => dayjs(a.period_start).valueOf() - dayjs(b.period_start).valueOf())
}

export function mapResponseToAnalyticsData(
  response: InfraMonitoringMultiData,
  attributes: InfraMonitoringAttribute[],
  dateFormat: string = DEFAULT_DATE_FORMAT
): Record<string, AnalyticsData> {
  const needs2MinAggregation = (response as { _originalInterval?: '2m' })._originalInterval === '2m'

  // Handle multi-attribute response format
  if (isMultiResponse(response)) {
    return attributes.reduce<Record<string, AnalyticsData>>((acc, attribute) => {
      const metadata = response.series?.[attribute]
      if (!metadata) return acc

      let dataPoints = response.data.map((point) => {
        const value = point.values?.[attribute]
        return {
          period_start: point.period_start,
          periodStartFormatted: dayjs(point.period_start).format(dateFormat),
          [attribute]: value === undefined ? 0 : Number(value),
        }
      })

      if (needs2MinAggregation) {
        dataPoints = aggregate1MinTo2Min(dataPoints)
      }

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

  let dataPoints = singleResponse.data.map((point) => {
    const value = point[attribute]
    return {
      period_start: point.period_start,
      periodStartFormatted: dayjs(point.period_start).format(dateFormat),
      [attribute]: value === undefined ? 0 : Number(value),
    }
  })

  if (needs2MinAggregation) {
    dataPoints = aggregate1MinTo2Min(dataPoints)
  }

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
