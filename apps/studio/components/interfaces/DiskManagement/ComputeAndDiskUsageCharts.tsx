import { useParams } from 'common'
import dayjs from 'dayjs'
import { Activity, BarChart2, Database } from 'lucide-react'
import { useMemo } from 'react'
import type { ChartConfig } from 'ui'
import { cn } from 'ui'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'

import {
  buildUsageChartData,
  formatUsagePercent,
  getComputeUsageSummary,
  getDiskUsageSummary,
  getUsageMetricStatus,
  type UsageMetricStatus,
} from './ComputeAndDiskUsageCharts.utils'
import { hasBurstableIO } from './DiskManagement.utils'
import type { InfraMonitoringAttribute } from '@/data/analytics/infra-monitoring-query'
import {
  getInfraMonitoringAttributes,
  useInfraMonitoringAttributesQuery,
} from '@/data/analytics/infra-monitoring-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatBytes } from '@/lib/helpers'

const USAGE_ATTRIBUTES = [
  'max_cpu_usage',
  'ram_usage',
  'disk_io_consumption',
  'disk_fs_used_system',
  'disk_fs_used_wal',
  'pg_database_size',
  'disk_fs_size',
] satisfies InfraMonitoringAttribute[]

const ROLLING_WINDOW_DAYS = 7

const getRollingWindow = () => {
  const now = dayjs()

  return {
    startDate: now.subtract(ROLLING_WINDOW_DAYS, 'day').toISOString(),
    endDate: now.toISOString(),
  }
}

const COMPUTE_CHART_CONFIG = {
  maxCpuUsage: {
    label: 'CPU',
    color: 'hsl(var(--brand-default))',
  },
  ramUsage: {
    label: 'Memory',
    color: 'hsl(var(--warning-default))',
  },
  diskIoConsumption: {
    label: 'Disk IO',
    color: 'hsl(var(--destructive-500))',
  },
} satisfies ChartConfig

const DISK_CHART_CONFIG = {
  databaseUsagePercent: {
    label: 'Database',
    color: 'hsl(var(--brand-default))',
  },
  walUsagePercent: {
    label: 'WAL',
    color: 'hsl(var(--warning-default))',
  },
  systemUsagePercent: {
    label: 'System',
    color: 'hsl(var(--destructive-500))',
  },
} satisfies ChartConfig

const PERCENTAGE_Y_AXIS_PROPS = {
  domain: [0, 100] as [number, number],
  allowDataOverflow: true,
  ticks: [0, 25, 50, 75, 100],
  tickFormatter: (value: number) => `${Math.round(Number(value))}%`,
  width: 64,
}

const getUsageCardClassName = (status: UsageMetricStatus) =>
  cn(
    // flex-1 equalises the two cards inside the grid. Avoid h-full: it
    // resolves against ProjectLayout's viewport-sized main in production.
    'flex flex-1 flex-col min-h-0 transition-colors',
    status === 'warning' && 'border-warning-400 bg-warning-200/30',
    status === 'negative' && 'border-destructive-400 bg-destructive-200/30'
  )

export const ComputeAndDiskUsageCharts = ({ className }: { className?: string }) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const supportsBurstableIO = hasBurstableIO(project?.infra_compute_size)

  // Anchor query key dates to mount time; fetch uses a rolling 7-day window on each refetch.
  const { startDate, endDate } = useMemo(getRollingWindow, [])

  const {
    data: usageData,
    isLoading,
    isError,
  } = useInfraMonitoringAttributesQuery(
    {
      projectRef,
      attributes: USAGE_ATTRIBUTES,
      startDate,
      endDate,
      interval: '1d',
    },
    {
      queryFn: ({ signal }) =>
        getInfraMonitoringAttributes(
          {
            projectRef,
            attributes: USAGE_ATTRIBUTES,
            ...getRollingWindow(),
            interval: '1d',
          },
          signal
        ),
    }
  )

  const { computeChartData, diskChartData } = useMemo(
    () => buildUsageChartData(usageData),
    [usageData]
  )

  const {
    peakCpuUsage,
    peakMemoryUsage,
    peakDiskIoUsage,
    peakComputeUsage,
    status: computeUsageStatus,
  } = useMemo(
    () => getComputeUsageSummary(computeChartData, supportsBurstableIO),
    [computeChartData, supportsBurstableIO]
  )

  const {
    latestDataPoint: latestDiskDataPoint,
    usagePercent: latestDiskUsage,
    status: diskUsageStatus,
  } = useMemo(() => getDiskUsageSummary(diskChartData), [diskChartData])

  const isComputeEmpty = computeChartData.length === 0
  const isDiskEmpty = diskChartData.length === 0

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 @[680px]:grid-cols-2 @[680px]:items-stretch',
        className
      )}
    >
      <div id="cpu" className="scroll-mt-24 min-h-0 flex flex-col">
        <span id="ram" className="block h-0 scroll-mt-24" aria-hidden />
        <span id="disk_io" className="block h-0 scroll-mt-24" aria-hidden />
        <Chart isLoading={isLoading} isErrored={isError} className="flex flex-1 flex-col min-h-0">
          <ChartCard className={getUsageCardClassName(computeUsageStatus)}>
            <ChartHeader align="start" className="min-h-[5.5rem]">
              <ChartMetric
                label="Compute"
                tooltip={
                  supportsBurstableIO
                    ? 'Peak CPU, memory, and disk IO usage over the last 7 days. Sustained high usage may require a larger compute size.'
                    : 'Peak CPU and memory usage over the last 7 days. Sustained high usage may require a larger compute size.'
                }
                value={formatUsagePercent(peakComputeUsage)}
                status={computeUsageStatus}
              />
              <div className="flex flex-wrap items-center gap-6">
                <ChartMetric
                  label="CPU"
                  value={formatUsagePercent(peakCpuUsage)}
                  status={getUsageMetricStatus(peakCpuUsage)}
                  align="end"
                />
                <ChartMetric
                  label="Memory"
                  value={formatUsagePercent(peakMemoryUsage)}
                  status={getUsageMetricStatus(peakMemoryUsage)}
                  align="end"
                />
                {supportsBurstableIO && (
                  <ChartMetric
                    label="Disk IO"
                    value={formatUsagePercent(peakDiskIoUsage)}
                    status={getUsageMetricStatus(peakDiskIoUsage)}
                    align="end"
                  />
                )}
              </div>
            </ChartHeader>
            <ChartContent
              className="p-0"
              isEmpty={isComputeEmpty}
              loadingState={<ChartLoadingState className="h-48 border-x-0 border-b-0" />}
              errorState={
                <ChartEmptyState
                  className="h-48 border-x-0 border-b-0"
                  icon={<Activity size={16} />}
                  title="Failed to load usage data"
                />
              }
              emptyState={
                <ChartEmptyState
                  className="h-48 border-x-0 border-b-0"
                  icon={<Activity size={16} />}
                  title="No compute data"
                  description="Usage data may take a few minutes to appear."
                />
              }
            >
              <div className="h-48 px-card pb-4 pt-2">
                <ChartLine
                  data={computeChartData}
                  dataKey="maxCpuUsage"
                  dataKeys={
                    supportsBurstableIO
                      ? ['maxCpuUsage', 'ramUsage', 'diskIoConsumption']
                      : ['maxCpuUsage', 'ramUsage']
                  }
                  DateTimeFormat="MMM D"
                  isFullHeight
                  showGrid
                  showYAxis
                  config={COMPUTE_CHART_CONFIG}
                  YAxisProps={PERCENTAGE_Y_AXIS_PROPS}
                />
              </div>
            </ChartContent>
          </ChartCard>
        </Chart>
      </div>

      <div id="disk" className="scroll-mt-24 min-h-0 flex flex-col">
        <Chart isLoading={isLoading} isErrored={isError} className="flex flex-1 flex-col min-h-0">
          <ChartCard className={getUsageCardClassName(diskUsageStatus)}>
            <ChartHeader align="start" className="min-h-[5.5rem]">
              <ChartMetric
                label="Disk"
                tooltip="Provisioned disk and used disk split by database, WAL, and system usage over the last 7 days."
                value={formatUsagePercent(latestDiskUsage)}
                status={diskUsageStatus}
              />
              <div className="flex flex-wrap items-center gap-6">
                <ChartMetric
                  label="Database"
                  value={
                    latestDiskDataPoint === undefined
                      ? '—'
                      : formatBytes(latestDiskDataPoint.databaseBytes, 1)
                  }
                  align="end"
                />
                <ChartMetric
                  label="WAL"
                  value={
                    latestDiskDataPoint === undefined
                      ? '—'
                      : formatBytes(latestDiskDataPoint.walBytes, 1)
                  }
                  align="end"
                />
                <ChartMetric
                  label="System"
                  value={
                    latestDiskDataPoint === undefined
                      ? '—'
                      : formatBytes(latestDiskDataPoint.systemBytes, 1)
                  }
                  align="end"
                />
              </div>
            </ChartHeader>
            <ChartContent
              className="p-0"
              isEmpty={isDiskEmpty}
              loadingState={<ChartLoadingState className="h-48 border-x-0 border-b-0" />}
              errorState={
                <ChartEmptyState
                  className="h-48 border-x-0 border-b-0"
                  icon={<BarChart2 size={16} />}
                  title="Failed to load usage data"
                />
              }
              emptyState={
                <ChartEmptyState
                  className="h-48 border-x-0 border-b-0"
                  icon={<Database size={16} />}
                  title="No disk data"
                  description="Disk metrics may take a few minutes to appear."
                />
              }
            >
              <div className="h-48 px-card pb-4 pt-2">
                <ChartLine
                  data={diskChartData}
                  dataKey="databaseUsagePercent"
                  dataKeys={['databaseUsagePercent', 'walUsagePercent', 'systemUsagePercent']}
                  DateTimeFormat="MMM D"
                  isFullHeight
                  showGrid
                  showYAxis
                  config={DISK_CHART_CONFIG}
                  YAxisProps={PERCENTAGE_Y_AXIS_PROPS}
                />
              </div>
            </ChartContent>
          </ChartCard>
        </Chart>
      </div>
    </div>
  )
}
