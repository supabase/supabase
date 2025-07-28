/**
 * useChartData
 *
 * A hook for fetching and processing data for a chart.
 * This hook is responsible for all the data fetching, combining, and state management logic
 * that was previously inside ComposedChartHandler.
 *
 * It takes all necessary parameters like project reference, date range, and attributes,
 * and returns the final chart data, loading state, and derived attributes.
 */
import { useMemo } from 'react'
import { useRouter } from 'next/router'

import type { AnalyticsInterval, DataPoint } from 'data/analytics/constants'
import { useAuthLogsReport } from 'data/reports/auth-report-query'
import type { ChartData } from 'components/ui/Charts/Charts.types'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import { useEdgeFunctionReport } from 'data/reports/edgefn-query'

export const useChartData = ({
  attributes,
  startDate,
  endDate,
  interval,
  data,
  highlightedValue,
  functionIds,
  enabled = true,
}: {
  attributes: MultiAttribute[]
  startDate: string
  endDate: string
  interval: string
  data?: ChartData
  highlightedValue?: string | number
  functionIds?: string[]
  enabled?: boolean
}) => {
  const router = useRouter()
  const { ref } = router.query

  const logsAttributes = attributes.filter((attr) => attr.provider === 'logs')

  const isEdgeFunctionRoute = router.asPath.includes('/reports/edge-functions')

  const {
    data: authData,
    attributes: authChartAttributes,
    isLoading: isAuthLoading,
  } = useAuthLogsReport({
    projectRef: ref as string,
    attributes: logsAttributes,
    startDate,
    endDate,
    interval: interval as AnalyticsInterval,
    enabled: enabled && logsAttributes.length > 0 && !isEdgeFunctionRoute,
  })

  const {
    data: edgeFunctionData,
    attributes: edgeFunctionChartAttributes,
    isLoading: isEdgeFunctionLoading,
  } = useEdgeFunctionReport({
    projectRef: ref as string,
    attributes: logsAttributes,
    startDate,
    endDate,
    interval: interval as AnalyticsInterval,
    enabled: enabled && logsAttributes.length > 0 && isEdgeFunctionRoute,
    functionIds,
  })

  const logsData = isEdgeFunctionRoute ? edgeFunctionData : authData
  const logsChartAttributes = isEdgeFunctionRoute
    ? edgeFunctionChartAttributes
    : authChartAttributes
  const isLogsLoading = isEdgeFunctionRoute ? isEdgeFunctionLoading : isAuthLoading

  const combinedData = useMemo(() => {
    if (data) return data

    // Get all unique timestamps from all datasets
    const timestamps = new Set<string>()
    if (logsData) {
      logsData.forEach((point: any) => {
        if (point?.period_start) {
          timestamps.add(point.period_start)
        }
      })
    }

    // Combine data points for each timestamp
    const combined = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }

        const logPoint = logsData?.find((p: any) => p.period_start === timestamp) || {}
        Object.assign(point, logPoint)

        return point as DataPoint
      })

    return combined as DataPoint[]
  }, [data, attributes, isLogsLoading, logsData, logsAttributes])

  const loading = logsAttributes.length > 0 && isLogsLoading

  // Calculate highlighted value based on the first attribute's data
  const _highlightedValue = useMemo(() => {
    if (highlightedValue !== undefined) return highlightedValue

    const firstAttr = attributes[0]
    const firstData = logsChartAttributes.find((p: any) => p.attribute === firstAttr.attribute)

    if (!firstData) return undefined

    const shouldHighlightMaxValue =
      firstAttr.provider === 'daily-stats' &&
      !firstAttr.attribute.includes('ingress') &&
      !firstAttr.attribute.includes('egress') &&
      'maximum' in firstData

    const shouldHighlightTotalGroupedValue = 'totalGrouped' in firstData

    return shouldHighlightMaxValue
      ? firstData.maximum
      : firstAttr.provider === 'daily-stats'
        ? firstData.total
        : shouldHighlightTotalGroupedValue
          ? firstData.totalGrouped?.[firstAttr.attribute as keyof typeof firstData.totalGrouped]
          : (firstData.data?.[firstData.data?.length - 1] as any)?.[firstAttr.attribute]
  }, [highlightedValue, attributes])

  return {
    data: combinedData,
    isLoading: loading,
    highlightedValue: _highlightedValue,
  }
}
