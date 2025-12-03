import { useMemo } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

import dayjs from 'dayjs'

import type { AnalyticsData, AnalyticsInterval } from './constants'
import type { InfraMonitoringAttribute } from './infra-monitoring-query'
import {
  InfraMonitoringMultiData,
  InfraMonitoringError,
  useInfraMonitoringAttributesQuery,
} from './infra-monitoring-query'

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
    return mapMultiResponseToAnalyticsData(query.data, attributes)
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
