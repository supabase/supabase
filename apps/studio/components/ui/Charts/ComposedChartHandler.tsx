import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { cn, WarningIcon } from 'ui'

import Panel from 'components/ui/Panel'
import ComposedChart from './ComposedChart'

import { AnalyticsInterval, DataPoint } from 'data/analytics/constants'
import { useInfraMonitoringQueries } from 'data/analytics/infra-monitoring-queries'
import { InfraMonitoringAttribute } from 'data/analytics/infra-monitoring-query'
import { useProjectDailyStatsQueries } from 'data/analytics/project-daily-stats-queries'
import { ProjectDailyStatsAttribute } from 'data/analytics/project-daily-stats-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useChartHighlight } from './useChartHighlight'

import dayjs from 'dayjs'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import type { ChartData } from './Charts.types'
import { MultiAttribute } from './ComposedChart.utils'

export interface ComposedChartHandlerProps {
  id?: string
  label: string
  attributes: MultiAttribute[]
  startDate: string
  endDate: string
  interval: string
  customDateFormat?: string
  defaultChartStyle?: 'bar' | 'line' | 'stackedAreaLine'
  hideChartType?: boolean
  data?: ChartData
  isLoading?: boolean
  format?: string
  highlightedValue?: string | number
  className?: string
  showTooltip?: boolean
  showLegend?: boolean
  showTotal?: boolean
  showMaxValue?: boolean
  updateDateRange?: UpdateDateRange
  valuePrecision?: number
  isVisible?: boolean
  docsUrl?: string
  hide?: boolean
}

/**
 * Wrapper component that handles intersection observer logic for lazy loading
 */
const LazyChartWrapper = ({ children }: PropsWithChildren) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '150px 0px', // Start loading before the component enters viewport
        threshold: 0,
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return <div ref={ref}>{React.cloneElement(children as React.ReactElement, { isVisible })}</div>
}

/**
 * Controls chart display state. Optionally fetches static chart data if data is not provided.
 *
 * If the `data` prop is provided, it will disable automatic chart data fetching and pass the data directly to the chart render.
 * - loading state can also be provided through the `isLoading` prop, to display loading placeholders. Ignored if `data` key not provided.
 * - if `isLoading=true` and `data` is `undefined`, loading error message will be shown.
 *
 * Provided data must be in the expected chart format.
 */
const ComposedChartHandler = ({
  label,
  attributes,
  startDate,
  endDate,
  interval,
  customDateFormat,
  children = null,
  defaultChartStyle = 'bar',
  hideChartType = false,
  data,
  isLoading,
  format,
  highlightedValue,
  className,
  showTooltip,
  showLegend,
  showMaxValue,
  showTotal,
  updateDateRange,
  valuePrecision,
  isVisible = true,
  id,
  ...otherProps
}: PropsWithChildren<ComposedChartHandlerProps>) => {
  const router = useRouter()
  const { ref } = router.query

  const state = useDatabaseSelectorStateSnapshot()
  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)
  const chartHighlight = useChartHighlight()

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
    isVisible
  )

  // Combine all the data into a single dataset
  const combinedData = useMemo(() => {
    if (data) return data

    const isLoading = attributeQueries.some((query: any) => query.isLoading)
    if (isLoading) return undefined

    const hasError = attributeQueries.some((query: any) => !query.data)
    if (hasError) return undefined

    // Get all unique timestamps from all datasets
    const timestamps = new Set<string>()
    attributeQueries.forEach((query: any) => {
      query.data?.data?.forEach((point: any) => {
        if (point?.period_start) {
          timestamps.add(point.period_start)
        }
      })
    })

    const referenceLineQueries = attributeQueries.filter(
      (_, index) => attributes[index].provider === 'reference-line'
    )

    // Combine data points for each timestamp
    const combined = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { timestamp }

        // Add regular attributes
        attributes.forEach((attr, index) => {
          if (!attr) return

          // Handle custom value attributes (like disk size)
          if (attr.customValue !== undefined) {
            point[attr.attribute] = attr.customValue
            return
          }

          // Skip reference line attributes here, we'll add them below
          if (attr.provider === 'reference-line') return

          const queryData = attributeQueries[index]?.data?.data
          const matchingPoint = queryData?.find((p: any) => p.period_start === timestamp)
          let value = matchingPoint?.[attr.attribute] ?? 0

          // Apply value manipulation if provided
          if (attr.manipulateValue && typeof attr.manipulateValue === 'function') {
            // Ensure value is a number before manipulation
            const numericValue = typeof value === 'number' ? value : Number(value) || 0
            value = attr.manipulateValue(numericValue)
          }

          point[attr.attribute] = value
        })

        // Add reference line values for each timestamp
        referenceLineQueries.forEach((query: any) => {
          const attr = query.data.attribute
          const value = query.data.total
          point[attr] = value
        })

        const formattedDataPoint: DataPoint =
          !('period_start' in point) && 'timestamp' in point
            ? { ...point, period_start: dayjs.utc(point.timestamp).unix() * 1000 }
            : point

        return formattedDataPoint
      })

    return combined as DataPoint[]
  }, [data, attributeQueries, attributes])

  const loading = isLoading || attributeQueries.some((query: any) => query.isLoading)

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
          : (firstData.data[firstData.data.length - 1] as any)?.[firstAttr.attribute]
  }, [highlightedValue, attributes, attributeQueries])

  if (loading) {
    return (
      <Panel
        className={cn(
          'flex min-h-[280px] w-full flex-col items-center justify-center gap-y-2',
          className
        )}
        wrapWithLoading={false}
        noMargin
        noHideOverflow
      >
        <Loader2 size={18} className="animate-spin text-border-strong" />
        <p className="text-xs text-foreground-lighter">Loading data for {label}</p>
      </Panel>
    )
  }

  if (!combinedData) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center gap-y-2">
        <WarningIcon />
        <p className="text-xs text-foreground-lighter">Unable to load data for {label}</p>
      </div>
    )
  }

  // Rest of the component remains similar, but pass all attributes to charts
  return (
    <Panel
      noMargin
      noHideOverflow
      className={cn('relative w-full scroll-mt-16', className)}
      wrapWithLoading={false}
      id={id ?? label.toLowerCase().replaceAll(' ', '-')}
    >
      <Panel.Content className="flex flex-col gap-4">
        <div className="absolute right-6 z-50 flex justify-between scroll-mt-16">{children}</div>
        <ComposedChart
          attributes={attributes}
          data={combinedData as DataPoint[]}
          format={format}
          // [Joshen] This is where it's messing up
          xAxisKey="period_start"
          yAxisKey={attributes[0].attribute}
          highlightedValue={_highlightedValue}
          title={label}
          customDateFormat={customDateFormat}
          chartHighlight={chartHighlight}
          chartStyle={chartStyle}
          showTooltip={showTooltip}
          showLegend={showLegend}
          showTotal={showTotal}
          showMaxValue={showMaxValue}
          onChartStyleChange={setChartStyle}
          updateDateRange={updateDateRange}
          valuePrecision={valuePrecision}
          hideChartType={hideChartType}
          {...otherProps}
        />
      </Panel.Content>
    </Panel>
  )
}

const useAttributeQueries = (
  attributes: MultiAttribute[],
  ref: string | string[] | undefined,
  startDate: string,
  endDate: string,
  interval: AnalyticsInterval,
  databaseIdentifier: string | undefined,
  data: ChartData | undefined,
  isVisible: boolean
) => {
  const infraAttributes = attributes
    .filter((attr) => attr?.provider === 'infra-monitoring')
    .map((attr) => attr.attribute as InfraMonitoringAttribute)
  const dailyStatsAttributes = attributes
    .filter((attr) => attr?.provider === 'daily-stats')
    .map((attr) => attr.attribute as ProjectDailyStatsAttribute)
  const referenceLines = attributes.filter((attr) => attr?.provider === 'reference-line')

  const infraQueries = useInfraMonitoringQueries(
    infraAttributes,
    ref,
    startDate,
    endDate,
    interval,
    databaseIdentifier,
    data,
    isVisible
  )
  const dailyStatsQueries = useProjectDailyStatsQueries(
    dailyStatsAttributes,
    ref,
    startDate,
    endDate,
    interval,
    databaseIdentifier,
    data,
    isVisible
  )

  const referenceLineQueries = referenceLines.map((line) => {
    let value = line.value || 0

    return {
      data: {
        data: [], // Will be populated in combinedData
        attribute: line.attribute,
        total: value,
        maximum: value,
        totalGrouped: { [line.attribute]: value },
      },
      isLoading: false,
      isError: false,
    }
  })

  return [...infraQueries, ...dailyStatsQueries, ...referenceLineQueries]
}

export default function LazyComposedChartHandler(props: ComposedChartHandlerProps) {
  if (props.hide) return null

  return (
    <LazyChartWrapper>
      <ComposedChartHandler {...props} />
    </LazyChartWrapper>
  )
}
