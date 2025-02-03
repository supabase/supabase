import { useRouter } from 'next/router'
import { PropsWithChildren, useState, useMemo } from 'react'
import { cn } from 'ui'

import AreaChart from 'components/ui/Charts/AreaChart'
import BarChart from 'components/ui/Charts/BarChart'
import { AnalyticsInterval, DataPoint } from 'data/analytics/constants'
import {
  InfraMonitoringAttribute,
  useInfraMonitoringQuery,
} from 'data/analytics/infra-monitoring-query'
import {
  ProjectDailyStatsAttribute,
  useProjectDailyStatsQuery,
} from 'data/analytics/project-daily-stats-query'
import { Loader2 } from 'lucide-react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { WarningIcon } from 'ui'
import type { ChartData } from './Charts.types'
import Panel from 'components/ui/Panel'
import { useChartHighlight } from './useChartHighlight'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import ComposedChart from './ComposedChart'

type Provider = 'infra-monitoring' | 'daily-stats'

export type MultiAttribute = {
  attribute: string
  provider: Provider
  label?: string
  color?: string
  description?: string
  docsLink?: string
  type?: 'line' | 'area-bar'
}

interface ChartHandlerProps {
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
  updateDateRange: UpdateDateRange
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
const ChartHandler = ({
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
  updateDateRange,
}: PropsWithChildren<ChartHandlerProps>) => {
  const router = useRouter()
  const { ref } = router.query

  const state = useDatabaseSelectorStateSnapshot()
  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)
  const chartHighlight = useChartHighlight()

  const databaseIdentifier = state.selectedDatabaseId

  // Query data for each attribute based on its provider
  const attributeQueries = attributes.map((attr) => {
    if (attr.provider === 'daily-stats') {
      return useProjectDailyStatsQuery(
        {
          projectRef: ref as string,
          attribute: attr.attribute as ProjectDailyStatsAttribute,
          startDate,
          endDate,
          interval: interval as AnalyticsInterval,
          databaseIdentifier,
        },
        { enabled: data === undefined }
      )
    } else {
      return useInfraMonitoringQuery(
        {
          projectRef: ref as string,
          attribute: attr.attribute as InfraMonitoringAttribute,
          startDate,
          endDate,
          interval: interval as AnalyticsInterval,
          databaseIdentifier,
        },
        { enabled: data === undefined }
      )
    }
  })

  // Combine all the data into a single dataset
  const combinedData = useMemo(() => {
    if (data) return data

    const isLoading = attributeQueries.some((query) => query.isLoading)
    if (isLoading) return undefined

    const hasError = attributeQueries.some((query) => !query.data)
    if (hasError) return undefined

    // Get all unique timestamps from all datasets
    const timestamps = new Set<string>()
    attributeQueries.forEach((query) => {
      query.data?.data?.forEach((point: any) => {
        timestamps.add(point.period_start)
      })
    })

    // Combine data points for each timestamp
    const combined = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { timestamp }
        attributes.forEach((attr, index) => {
          const queryData = attributeQueries[index].data?.data
          const matchingPoint = queryData?.find((p: any) => p.period_start === timestamp)
          point[attr.attribute] = matchingPoint?.[attr.attribute] ?? 0
        })
        return point as DataPoint
      })

    return combined as DataPoint[]
  }, [data, attributeQueries, attributes])

  console.log('combinedData', combinedData)

  const loading = isLoading || attributeQueries.some((query) => query.isLoading)

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
      <div className="flex h-52 w-full flex-col items-center justify-center gap-y-2">
        <Loader2 size={18} className="animate-spin text-border-strong" />
        <p className="text-xs text-foreground-lighter">Loading data for {label}</p>
      </div>
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
      className={cn('relative py-2 w-full', className)}
      wrapWithLoading={false}
    >
      <Panel.Content className="flex flex-col gap-4">
        <div
          className="absolute right-6 z-50 flex justify-between scroll-mt-10"
          id={label.toLowerCase().replaceAll(' ', '-')}
        >
          {children}
        </div>
        <ComposedChart
          attributes={attributes}
          YAxisProps={{ width: 1 }}
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
          onChartStyleChange={setChartStyle}
          updateDateRange={updateDateRange}
        />
      </Panel.Content>
    </Panel>
  )
}

export default ChartHandler
