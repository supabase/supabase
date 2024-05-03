import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { PropsWithChildren, useState } from 'react'
import { Button } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AreaChart from 'components/ui/Charts/AreaChart'
import {
  InfraMonitoringAttribute,
  InfraMonitoringInterval,
  useInfraMonitoringQuery,
} from 'data/analytics/infra-monitoring-query'
import { Activity, BarChartIcon, Loader2 } from 'lucide-react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'
import type { ChartData } from './ChartHandler.types'
import { BarChart } from './ChartRenderer'

interface ChartHandlerProps {
  label: string
  attribute: string
  provider: string
  startDate: string
  endDate: string
  interval: string
  customDateFormat?: string
  defaultChartStyle?: 'bar' | 'line'
  hideChartType?: boolean
  data?: ChartData
  isLoading?: boolean
  format?: string
  highlightedValue?: string | number
  onBarClick?: (v: any) => void
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
  attribute,
  provider,
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
  onBarClick,
}: PropsWithChildren<ChartHandlerProps>) => {
  const router = useRouter()
  const { ref } = router.query

  const { project } = useProjectContext()
  const isReadReplicasEnabled = project?.is_read_replicas_enabled
  const state = useDatabaseSelectorStateSnapshot()

  const databaseIdentifier = isReadReplicasEnabled ? state.selectedDatabaseId : undefined

  const { data: fetchedData, isLoading: isFetching } = useInfraMonitoringQuery(
    {
      projectRef: ref as string,
      attribute: attribute as InfraMonitoringAttribute,
      startDate,
      endDate,
      interval: interval as InfraMonitoringInterval,
      databaseIdentifier,
    },
    { enabled: data === undefined }
  )

  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)
  const chartData = data || fetchedData
  const loading = isLoading || isFetching

  const shouldHighlightMaxValue =
    provider === 'daily-stats' &&
    !attribute.includes('ingress') &&
    !attribute.includes('egress') &&
    chartData !== undefined &&
    'maximum' in chartData
  const shoudHighlightTotalGroupedValue =
    provider === 'log-stats' && chartData !== undefined && 'totalGrouped' in chartData

  const _highlightedValue =
    highlightedValue !== undefined
      ? highlightedValue
      : shouldHighlightMaxValue
        ? chartData?.maximum
        : provider === 'daily-stats'
          ? chartData?.total
          : shoudHighlightTotalGroupedValue
            ? chartData?.totalGrouped?.[attribute]
            : (chartData?.data[chartData?.data.length - 1] as any)?.[attribute as any]

  if (loading) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center gap-y-2">
        <Loader2 size={18} className="animate-spin text-border-strong" />
        <p className="text-xs text-foreground-lighter">Loading data for {label}</p>
      </div>
    )
  }

  if (isUndefined(chartData)) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center gap-y-2">
        <WarningIcon />
        <p className="text-xs text-foreground-lighter">Unable to load data for {label}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div className="absolute right-6 z-50 flex justify-between">
        <div className="space-y-3">{children}</div>
        {!hideChartType && (
          <div>
            <div className="flex w-full space-x-3">
              <Button
                type="default"
                className="px-1.5"
                icon={chartStyle === 'bar' ? <Activity /> : <BarChartIcon />}
                onClick={() => setChartStyle(chartStyle === 'bar' ? 'line' : 'bar')}
              />
            </div>
          </div>
        )}
      </div>

      {chartStyle === 'bar' ? (
        <BarChart
          data={chartData?.data ?? []}
          attribute={attribute}
          yAxisLimit={chartData?.yAxisLimit}
          format={format || chartData?.format}
          highlightedValue={_highlightedValue}
          label={label}
          customDateFormat={customDateFormat}
          onBarClick={onBarClick}
        />
      ) : (
        <AreaChart
          data={(chartData?.data ?? []) as any}
          format={format || chartData?.format}
          xAxisKey="period_start"
          yAxisKey={attribute}
          highlightedValue={_highlightedValue}
          title={label}
          customDateFormat={customDateFormat}
        />
      )}
    </div>
  )
}

export default ChartHandler
