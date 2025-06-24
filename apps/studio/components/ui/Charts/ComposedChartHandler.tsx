import React, { PropsWithChildren, useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Loader2 } from 'lucide-react'
import { cn, WarningIcon } from 'ui'

import Panel from 'components/ui/Panel'
import ComposedChart from './ComposedChart'

import { AnalyticsInterval, DataPoint } from 'data/analytics/constants'
import { InfraMonitoringAttribute } from 'data/analytics/infra-monitoring-query'
import { useInfraMonitoringQueries } from 'data/analytics/infra-monitoring-queries'
import { ProjectDailyStatsAttribute } from 'data/analytics/project-daily-stats-query'
import { useProjectDailyStatsQueries } from 'data/analytics/project-daily-stats-queries'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useChartHighlight } from './useChartHighlight'
import { getMockDataForAttribute } from 'data/reports/auth-charts'
import { useAuthLogsReport } from 'data/reports/auth-report-query'

import type { ChartData } from './Charts.types'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import type { MultiAttribute } from './ComposedChart.utils'

interface ComposedChartHandlerProps {
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
  updateDateRange: UpdateDateRange
  valuePrecision?: number
  isVisible?: boolean
  titleTooltip?: string
  docsUrl?: string
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
  titleTooltip,
  id,
  ...otherProps
}: PropsWithChildren<ComposedChartHandlerProps>) => {
  const router = useRouter()
  const { ref } = router.query

  const state = useDatabaseSelectorStateSnapshot()
  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)
  const chartHighlight = useChartHighlight()

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
    isVisible
  )

  // Combine all the data into a single dataset
  const combinedData = useMemo(() => {
    if (data) return data

    const regularAttributeQueries = attributeQueries.filter(
      (q) => q.data?.provider !== 'logs' && q.data?.provider !== 'reference-line'
    )
    const isLoading = isLogsLoading || regularAttributeQueries.some((query: any) => query.isLoading)
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
  }, [data, attributeQueries, attributes, chartAttributes, isLogsLoading, logsData])

  const loading =
    isLoading || isLogsLoading || attributeQueries.some((query: any) => query.isLoading)

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

  if (loading) {
    return (
      <Panel
        className={cn(
          'flex min-h-[320px] w-full flex-col items-center justify-center gap-y-2',
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
      className={cn('relative py-2 w-full scroll-mt-16', className)}
      wrapWithLoading={false}
      id={id ?? label.toLowerCase().replaceAll(' ', '-')}
    >
      <Panel.Content className="flex flex-col gap-4">
        <div className="absolute right-6 z-50 flex justify-between scroll-mt-16">{children}</div>
        <ComposedChart
          attributes={chartAttributes}
          data={combinedData as DataPoint[]}
          format={format}
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
          titleTooltip={titleTooltip}
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
  const projectRef = typeof ref === 'string' ? ref : Array.isArray(ref) ? ref[0] : ''

  const infraAttributes = attributes.filter((attr) => attr.provider === 'infra-monitoring')
  const dailyStatsAttributes = attributes.filter((attr) => attr.provider === 'daily-stats')
  const mockAttributes = attributes.filter((attr) => attr.provider === 'mock')
  const referenceLineAttributes = attributes.filter((attr) => attr.provider === 'reference-line')

  const infraQueries = useInfraMonitoringQueries(
    infraAttributes.map((attr) => attr.attribute as InfraMonitoringAttribute),
    ref,
    startDate,
    endDate,
    interval,
    databaseIdentifier,
    data,
    isVisible
  )
  const dailyStatsQueries = useProjectDailyStatsQueries(
    dailyStatsAttributes.map((attr) => attr.attribute as ProjectDailyStatsAttribute),
    ref,
    startDate,
    endDate,
    interval,
    databaseIdentifier,
    data,
    isVisible
  )

  let infraIdx = 0
  let dailyStatsIdx = 0
  return attributes
    .filter((attr) => attr.provider !== 'logs')
    .map((attr) => {
      if (attr.provider === 'infra-monitoring') {
        return {
          ...infraQueries[infraIdx++],
          data: { ...infraQueries[infraIdx - 1]?.data, provider: 'infra-monitoring' },
        }
      } else if (attr.provider === 'daily-stats') {
        return {
          ...dailyStatsQueries[dailyStatsIdx++],
          data: { ...dailyStatsQueries[dailyStatsIdx - 1]?.data, provider: 'daily-stats' },
        }
      } else if (attr.provider === 'mock') {
        const mockData = getMockDataForAttribute(attr.attribute)
        return {
          isLoading: false,
          data: { ...mockData, provider: 'mock', attribute: attr.attribute },
        }
      } else if (attr.provider === 'reference-line') {
        let value = attr.value || 0
        return {
          data: {
            data: [],
            attribute: attr.attribute,
            total: value,
            maximum: value,
            totalGrouped: { [attr.attribute]: value },
            provider: 'reference-line',
          },
          isLoading: false,
          isError: false,
        }
      } else {
        return {
          isLoading: false,
          data: undefined,
        }
      }
    })
}

export default function LazyComposedChartHandler(props: ComposedChartHandlerProps) {
  return (
    <LazyChartWrapper>
      <ComposedChartHandler {...props} />
    </LazyChartWrapper>
  )
}
