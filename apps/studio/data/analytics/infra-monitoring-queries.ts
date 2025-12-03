import { useMemo } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

import dayjs from 'dayjs'

import type { AnalyticsData, AnalyticsInterval } from './constants'
import type { InfraMonitoringAttribute } from './infra-monitoring-query'
import {
  InfraMonitoringMultiData,
  InfraMonitoringError,
  useInfraMonitoringAttributesQuery,
  useInfraMonitoringQuery,
} from './infra-monitoring-query'

const DEFAULT_DATE_FORMAT = 'HH:mm DD MMM'
const DEFAULT_ATTRIBUTE: InfraMonitoringAttribute = 'max_cpu_usage'

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
  const isSingleAttribute = attributes.length === 1
  const primaryAttribute = attributes[0] ?? DEFAULT_ATTRIBUTE

  const singleAttributeQuery = useInfraMonitoringQuery(
    {
      projectRef: ref as string,
      attribute: primaryAttribute,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    },
    { enabled: shouldFetch && isSingleAttribute && hasAttributes }
  )

  const multiQuery = useInfraMonitoringAttributesQuery(
    {
      projectRef: ref as string,
      attributes,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    },
    { enabled: shouldFetch && attributes.length > 1 }
  )

  const seriesByAttribute = useMemo(() => {
    if (!multiQuery.data) return undefined
    return mapMultiResponseToAnalyticsData(multiQuery.data, attributes)
  }, [multiQuery.data, attributes])

  if (!hasAttributes) {
    return []
  }

  if (isSingleAttribute) {
    return [singleAttributeQuery]
  }

  return attributes.map<InfraQueryResult>((attribute) => ({
    data: seriesByAttribute?.[attribute],
    error: multiQuery.error,
    isError: multiQuery.isError,
    isFetching: multiQuery.isFetching,
    isLoading: multiQuery.isLoading,
    status: multiQuery.status,
  }))
}

export function mapMultiResponseToAnalyticsData(
  response: InfraMonitoringMultiData,
  attributes: InfraMonitoringAttribute[],
  dateFormat: string = DEFAULT_DATE_FORMAT
) {
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
