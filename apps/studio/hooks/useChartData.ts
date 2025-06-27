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

import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { AnalyticsInterval, DataPoint } from 'data/analytics/constants'
import { useAuthLogsReport } from 'data/reports/auth-report-query'
import type { ChartData } from 'components/ui/Charts/Charts.types'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import { useAttributeQueries } from 'components/ui/Charts/ComposedChartHandler'

export const useChartData = ({
  attributes,
  startDate,
  endDate,
  interval,
  data,
  highlightedValue,
}: {
  attributes: MultiAttribute[]
  startDate: string
  endDate: string
  interval: string
  data?: ChartData
  highlightedValue?: string | number
}) => {
  const router = useRouter()
  const { ref } = router.query
  const state = useDatabaseSelectorStateSnapshot()

  const logsAttributes = attributes.filter((attr) => attr.provider === 'logs')
  const nonLogsAttributes = attributes.filter((attr) => attr.provider !== 'logs')

  const {
    data: logsData,
    attributes: logsChartAttributes,
    isLoading: isLogsLoading,
  } = useAuthLogsReport({
    projectRef: ref as string,
    attributes: logsAttributes,
    startDate,
    endDate,
    interval: interval as AnalyticsInterval,
    enabled: logsAttributes.length > 0,
  })

  const chartAttributes = useMemo(
    () => nonLogsAttributes.concat(logsChartAttributes || []),
    [nonLogsAttributes, logsChartAttributes]
  )

  const databaseIdentifier = state.selectedDatabaseId

  // Use the custom hook at the top level of the component
  const attributeQueries = useAttributeQueries(
    attributes,
    ref,
    startDate,
    endDate,
    interval as AnalyticsInterval,
    databaseIdentifier,
    data,
    true
  )

  // Combine all the data into a single dataset
  const combinedData = useMemo(() => {
    if (data) return data

    const regularAttributeQueries = attributeQueries.filter(
      (q) => q.data?.provider !== 'logs' && q.data?.provider !== 'reference-line'
    )
    const isLoading =
      (logsAttributes.length > 0 && isLogsLoading) ||
      regularAttributeQueries.some((query: any) => query.isLoading)
    if (isLoading) {
      return undefined
    }

    const hasError = regularAttributeQueries.some((query: any) => !query.data)
    if (hasError) {
      return undefined
    }

    // Get all unique timestamps from all datasets
    const timestamps = new Set<string>()
    if (logsData) {
      logsData.forEach((point: any) => {
        if (point?.period_start) {
          timestamps.add(point.period_start)
        }
      })
    }
    regularAttributeQueries.forEach((query: any) => {
      query.data?.data?.forEach((point: any) => {
        if (point?.period_start) {
          timestamps.add(point.period_start)
        }
      })
    })

    const referenceLineQueries = attributeQueries.filter(
      (q) => q.data?.provider === 'reference-line'
    )

    // Combine data points for each timestamp
    const combined = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }

        const logPoint = logsData?.find((p: any) => p.period_start === timestamp) || {}
        Object.assign(point, logPoint)

        chartAttributes.forEach((attr) => {
          if (!attr) return
          if (attr.provider === 'logs') return
          if (attr.provider === 'reference-line') return
          if (attr.customValue !== undefined) {
            point[attr.attribute] = attr.customValue
            return
          }

          const query = regularAttributeQueries.find((q) => q.data?.attribute === attr.attribute)
          const matchingPoint = query?.data?.data?.find((p: any) => p.period_start === timestamp)
          point[attr.attribute] = matchingPoint?.[attr.attribute] ?? 0
        })

        // Add reference line values for each timestamp
        referenceLineQueries.forEach((query: any) => {
          const attr = query.data.attribute
          const value = query.data.total
          point[attr] = value
        })

        return point as DataPoint
      })

    return combined as DataPoint[]
  }, [data, attributeQueries, attributes, chartAttributes, isLogsLoading, logsData, logsAttributes])

  const loading =
    (logsAttributes.length > 0 && isLogsLoading) ||
    attributeQueries.some((query: any) => query.isLoading)

  // Calculate highlighted value based on the first attribute's data
  const _highlightedValue = useMemo(() => {
    if (highlightedValue !== undefined) return highlightedValue

    const firstAttr = attributes[0]
    const firstQuery = attributeQueries[0]
    const firstData = firstQuery?.data

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
  }, [highlightedValue, attributes, attributeQueries])

  return {
    data: combinedData,
    isLoading: loading,
    chartAttributes,
    highlightedValue: _highlightedValue,
  }
}
