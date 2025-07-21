import React, { PropsWithChildren, useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn, WarningIcon } from 'ui'

import Panel from 'components/ui/Panel'
import ComposedChart from './ComposedChart'

import { AnalyticsInterval, DataPoint } from 'data/analytics/constants'
import { InfraMonitoringAttribute } from 'data/analytics/infra-monitoring-query'
import { useInfraMonitoringQueries } from 'data/analytics/infra-monitoring-queries'
import { ProjectDailyStatsAttribute } from 'data/analytics/project-daily-stats-query'
import { useProjectDailyStatsQueries } from 'data/analytics/project-daily-stats-queries'
import { useChartHighlight } from './useChartHighlight'

import type { ChartData } from './Charts.types'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import type { MultiAttribute } from './ComposedChart.utils'

interface LogChartHandlerProps {
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
const LogChartHandler = ({
  label,
  attributes,
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
  titleTooltip,
  id,
  ...otherProps
}: PropsWithChildren<LogChartHandlerProps>) => {
  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)
  const chartHighlight = useChartHighlight()

  if (!data) {
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
      className={cn('relative w-full overflow-hidden scroll-mt-16', className)}
      wrapWithLoading={false}
      id={id ?? label.toLowerCase().replaceAll(' ', '-')}
    >
      {isLoading && (
        <div className="absolute inset-0 rounded-md flex w-full flex-col items-center justify-center gap-y-2 bg-surface-100 backdrop z-20">
          <Loader2 size={18} className="animate-spin text-border-strong" />
          <p className="text-xs text-foreground-lighter">Loading data for {label}</p>
        </div>
      )}
      <Panel.Content className="flex flex-col gap-4">
        <div className="absolute right-6 z-50 flex justify-between scroll-mt-16">{children}</div>
        <ComposedChart
          attributes={attributes}
          data={data as any}
          format={format}
          xAxisKey="period_start"
          yAxisKey={attributes[0].attribute}
          highlightedValue={highlightedValue}
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

export const useAttributeQueries = (
  attributes: MultiAttribute[],
  ref: string | string[] | undefined,
  startDate: string,
  endDate: string,
  interval: AnalyticsInterval,
  databaseIdentifier: string | undefined,
  data: ChartData | undefined,
  isVisible: boolean
) => {
  const infraAttributes = attributes.filter((attr) => attr.provider === 'infra-monitoring')
  const dailyStatsAttributes = attributes.filter((attr) => attr.provider === 'daily-stats')

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

export default function LazyLogChartHandler(props: LogChartHandlerProps) {
  return (
    <LazyChartWrapper>
      <LogChartHandler {...props} />
    </LazyChartWrapper>
  )
}
