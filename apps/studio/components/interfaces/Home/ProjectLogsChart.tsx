import { useMemo, useState } from 'react'
import {
  BarChart,
  AlertTriangle,
  XCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts'

import { useCombinedLogsStats, LogSource } from 'hooks/analytics/useCombinedLogsStats'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import type { AnalyticsInterval } from 'data/analytics/constants'
import {
  Button,
  Card,
  cn,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import AlertError from 'components/ui/AlertError'
import { useParams } from 'common'
import { ProjectUsageBars } from './ProjectUsageBars'

interface ProjectLogsChartProps {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
}

// Helper to calculate percentage change
const calculatePercentageChange = (current?: number, previous?: number): number | null => {
  if (
    previous === undefined ||
    previous === null ||
    current === undefined ||
    current === null ||
    !isFinite(previous) || // Ensure previous is finite
    !isFinite(current) // Ensure current is finite
  ) {
    return null
  }
  if (previous === 0) {
    return current > 0 ? Infinity : 0 // Handle division by zero
  }
  return ((current - previous) / previous) * 100
}

// Define filter options
const LOG_SOURCE_OPTIONS: { value: LogSource; label: string }[] = [
  { value: 'all', label: 'All Requests' },
  { value: LogsTableName.AUTH, label: 'Auth' },
  { value: LogsTableName.POSTGREST, label: 'Database API' }, // Renamed for clarity
  { value: LogsTableName.FN_EDGE, label: 'Edge Functions' },
  { value: LogsTableName.REALTIME, label: 'Realtime' },
  { value: LogsTableName.STORAGE, label: 'Storage' },
]

// Define colors for the chart segments using LogsBarChart conventions
const STATUS_COLORS = {
  OK: 'hsl(var(--brand-default))', // Use GREEN_1 equivalent
  Warning: 'hsl(var(--warning-default))', // Use YELLOW_1 equivalent
  Error: 'hsl(var(--destructive-default))', // Use RED_1 equivalent
}

// Custom Tooltip Component
const CustomTooltip = ({
  active,
  payload,
  previousCounts,
}: TooltipProps<number, string> & {
  previousCounts: { ok?: number; warning?: number; error?: number }
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload // Access the data object for the hovered segment
    const status = data.name as 'OK' | 'Warning' | 'Error' // Type assertion
    const currentValue = data.value
    const previousValue =
      status === 'OK'
        ? previousCounts.ok
        : status === 'Warning'
          ? previousCounts.warning
          : previousCounts.error

    const percentageChange = calculatePercentageChange(currentValue, previousValue)
    let trendText = '-'
    let trendColor = 'text-foreground-lighter'
    let TrendIcon = Minus

    if (percentageChange !== null && isFinite(percentageChange)) {
      const sign = percentageChange > 0 ? '+' : ''
      trendText = `${sign}${percentageChange.toFixed(0)}%`
      if (status === 'Error' || status === 'Warning') {
        trendColor = percentageChange > 0 ? 'text-destructive' : 'text-brand'
        TrendIcon = percentageChange > 0 ? TrendingUp : TrendingDown
      } else {
        trendColor = percentageChange >= 0 ? 'text-brand' : 'text-destructive'
        TrendIcon = percentageChange >= 0 ? TrendingUp : TrendingDown
      }
    } else if (percentageChange === Infinity) {
      trendText = '+Inf%'
      trendColor = status === 'Error' || status === 'Warning' ? 'text-destructive' : 'text-brand'
      TrendIcon = TrendingUp
    } else if (currentValue !== undefined && previousValue === undefined) {
      trendText = 'New'
      trendColor = 'text-foreground-lighter'
    } else if (currentValue === undefined && previousValue !== undefined) {
      trendText = '-'
      trendColor = 'text-foreground-lighter'
    } else if (percentageChange === 0) {
      TrendIcon = Minus
      trendText = '0%'
      trendColor = 'text-foreground-lighter'
    }

    let StatusIcon = CheckCircle
    if (status === 'Warning') StatusIcon = AlertTriangle
    if (status === 'Error') StatusIcon = XCircle

    return (
      <div className="rounded-md text-sm border bg-popover px-3 py-2 text-sm shadow-md dark:bg-background-surface-100 w-[200px]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-foreground-light">
            <StatusIcon
              size={14}
              className={
                status === 'OK'
                  ? 'text-brand'
                  : status === 'Warning'
                    ? 'text-warning'
                    : 'text-destructive'
              }
            />
            {status}
          </div>
          <span className="font-mono tabular-nums">{currentValue?.toLocaleString() ?? 0}</span>
          <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
            <TrendIcon size={12} strokeWidth={1.5} />
            <span>{trendText}</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

const ProjectLogsChart = ({ projectRef, startDate, endDate, interval }: ProjectLogsChartProps) => {
  const { ref } = useParams()
  const [selectedSource, setSelectedSource] = useState<LogSource>('all') // Add state for filter

  const {
    chartData,
    error,
    isLoading,
    isSuccess,
    totalCount,
    previousTotalCount,
    totalOkCount,
    totalWarningCount,
    totalErrorCount,
    previousTotalOkCount,
    previousTotalWarningCount,
    previousTotalErrorCount,
  } = useCombinedLogsStats({
    projectRef,
    startDate,
    endDate,
    interval,
    selectedSource, // Pass selected source to hook
  })

  // Prepare data for the donut chart
  const chartStatusData = useMemo(() => {
    return [
      { name: 'OK', value: totalOkCount ?? 0, fill: STATUS_COLORS.OK },
      { name: 'Warning', value: totalWarningCount ?? 0, fill: STATUS_COLORS.Warning },
      { name: 'Error', value: totalErrorCount ?? 0, fill: STATUS_COLORS.Error },
    ].filter((item) => item.value > 0) // Filter out zero values to avoid rendering empty segments
  }, [totalOkCount, totalWarningCount, totalErrorCount])

  const previousCounts = useMemo(
    () => ({
      ok: previousTotalOkCount,
      warning: previousTotalWarningCount,
      error: previousTotalErrorCount,
    }),
    [previousTotalOkCount, previousTotalWarningCount, previousTotalErrorCount]
  )

  // Calculate percentage change for total
  const totalPercentageChange = useMemo(() => {
    return calculatePercentageChange(totalCount, previousTotalCount)
  }, [totalCount, previousTotalCount])

  const totalTrendIcon = useMemo(() => {
    if (
      totalPercentageChange === null ||
      !isFinite(totalPercentageChange) ||
      totalPercentageChange === 0
    ) {
      return <Minus size={14} strokeWidth={1.5} />
    }
    return totalPercentageChange > 0 ? (
      <TrendingUp size={14} strokeWidth={1.5} />
    ) : (
      <TrendingDown size={14} strokeWidth={1.5} />
    )
  }, [totalPercentageChange])

  const totalTrendText = useMemo(() => {
    if (totalPercentageChange === null) {
      return 'No previous data'
    }
    if (!isFinite(totalPercentageChange)) {
      return 'Previously 0'
    }
    const sign = totalPercentageChange > 0 ? '+' : ''
    return `${sign}${totalPercentageChange.toFixed(1)}%`
  }, [totalPercentageChange])

  const totalTrendColor = useMemo(() => {
    if (
      totalPercentageChange === null ||
      !isFinite(totalPercentageChange) ||
      totalPercentageChange === 0
    ) {
      return 'text-foreground-lighter'
    }
    // Generally, more requests might be good or neutral, let's use brand color for increase
    return totalPercentageChange > 0 ? 'text-brand-600' : 'text-brand'
  }, [totalPercentageChange])

  return (
    <div className="relative z-10">
      <div>
        {/* Main Content Area */}
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div>
            {/* Filter and Total Count (Moved to the right) */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-2">
                {/* Donut Chart for Status Breakdown (Moved to the left) */}
                <div className="col-span-1 flex items-center justify-center md:justify-start pt-2">
                  {
                    isLoading ? (
                      <ShimmeringLoader className="w-24 h-24 rounded-full" />
                    ) : isSuccess && chartStatusData.length > 0 ? (
                      <ResponsiveContainer width={40} height={40}>
                        <PieChart>
                          <Tooltip
                            content={<CustomTooltip previousCounts={previousCounts} />}
                            wrapperStyle={{ zIndex: 10 }} // Ensure tooltip is above other elements
                          />
                          <Pie
                            data={chartStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={17} // Adjust for donut thickness
                            outerRadius={20} // Adjust for size
                            paddingAngle={chartStatusData.length > 1 ? 2 : 0} // Add padding between segments if more than one
                          >
                            {chartStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : isSuccess && totalCount > 0 && chartStatusData.length === 0 ? (
                      // Case where there are logs but no status breakdown (shouldn't happen often)
                      <div className="text-center text-xs text-foreground-lighter">
                        Status unavailable
                      </div>
                    ) : null /* Handle no data case below */
                  }
                </div>
                <h3 className="text-6xl font-mono tabular-nums">
                  {isLoading && <span className="animate-pulse">-</span>}
                  {isSuccess && totalCount.toLocaleString()}
                </h3>
              </div>
              <div className="text-sm text-foreground-light flex items-center gap-3">
                Requests in the last hour{' '}
                {isLoading ? (
                  <ShimmeringLoader className="h-4 w-28" />
                ) : isSuccess && previousTotalCount !== undefined ? (
                  <>
                    <p
                      className={cn(
                        totalTrendColor,
                        'font-mono tracking-tighter font-semibold flex items-center gap-1'
                      )}
                    >
                      {totalTrendIcon}
                      {totalTrendText}
                    </p>
                  </>
                ) : (
                  <p className="text-foreground-lighter font-mono tracking-tighter">
                    Previous period data unavailable
                  </p>
                )}
                <Select
                  value={selectedSource}
                  onValueChange={(value) => setSelectedSource(value as LogSource)}
                >
                  <SelectTrigger className="w-fit" size="tiny">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOG_SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <ProjectUsageBars projectRef={projectRef} />
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-0">
        {isLoading && (
          <div className="space-y-2 mt-12">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
          </div>
        )}
        {error && (
          <AlertError subject="Failed to retrieve logs data" error={error} className="mb-4" />
        )}
        {isSuccess && (
          <>
            {totalCount === 0 && previousTotalCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-y-1">
                <BarChart className="text-foreground-light" strokeWidth={1} />
                <p className="text-sm text-foreground-light">No API requests recorded</p>
                <p className="text-xs text-foreground-lighter">In the last two hours</p>
              </div>
            ) : (
              <div className="pt-12">
                <LogsBarChart isSubtle barHeight={300} data={chartData} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectLogsChart
