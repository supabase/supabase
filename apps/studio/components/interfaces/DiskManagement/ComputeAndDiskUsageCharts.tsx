import { useParams } from 'common'
import dayjs from 'dayjs'
import { Activity, BarChart2, Database, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import type { ChartConfig } from 'ui'
import { cn } from 'ui'
import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartMetric,
  type ChartLineTick,
} from 'ui-patterns/Chart'

import type { InfraMonitoringAttribute } from '@/data/analytics/infra-monitoring-query'
import { useInfraMonitoringAttributesQuery } from '@/data/analytics/infra-monitoring-query'
import { formatBytes } from '@/lib/helpers'

type UsageChartDatum = {
  timestamp: string
  maxCpuUsage?: number
  ramUsage?: number
  diskIoConsumption?: number
  databaseBytes?: number
  walBytes?: number
  systemBytes?: number
  diskSizeBytes?: number
  diskUsagePercent?: number
}

const USAGE_ATTRIBUTES = [
  'max_cpu_usage',
  'ram_usage',
  'disk_io_consumption',
  'disk_fs_used_system',
  'disk_fs_used_wal',
  'pg_database_size',
  'disk_fs_size',
] as InfraMonitoringAttribute[]

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

const formatUsagePercent = (value: number | undefined) =>
  value === undefined ? '—' : `${value.toFixed(0)}%`

const getUsageMetricStatus = (value: number | undefined): 'default' | 'warning' | 'negative' => {
  if (value === undefined) return 'default'
  if (value >= 90) return 'negative'
  if (value >= 75) return 'warning'
  return 'default'
}

const getWorstUsageMetricStatus = (
  ...values: Array<number | undefined>
): 'default' | 'warning' | 'negative' => {
  const statuses = values.map(getUsageMetricStatus)
  if (statuses.includes('negative')) return 'negative'
  if (statuses.includes('warning')) return 'warning'
  return 'default'
}

const toNumber = (value: string | number | undefined) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const clampPercentage = (value: number) => Math.min(Math.max(value, 0), 100)

const getPeakChartValue = (data: UsageChartDatum[], dataKey: keyof UsageChartDatum) => {
  if (data.length === 0) return undefined

  const values = data
    .map((point) => point[dataKey])
    .filter((value): value is number => typeof value === 'number')

  if (values.length === 0) return undefined

  return Math.max(...values)
}

export const ComputeAndDiskUsageCharts = ({ className }: { className?: string }) => {
  const { ref: projectRef } = useParams()

  // Intentionally anchored to mount time so the query key stays stable across re-renders.
  const { startDate, endDate } = useMemo(() => {
    const now = dayjs()

    return {
      startDate: now.subtract(7, 'day').toISOString(),
      endDate: now.toISOString(),
    }
  }, [])

  const {
    data: usageData,
    isLoading,
    isError,
  } = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: USAGE_ATTRIBUTES,
    startDate,
    endDate,
    interval: '1d',
  })

  const { computeChartData, diskChartData } = useMemo(() => {
    if (!usageData || !('series' in usageData)) {
      return {
        computeChartData: [],
        diskChartData: [],
      }
    }

    const computeChartData = usageData.data.map((point) => ({
      timestamp: point.period_start,
      maxCpuUsage: clampPercentage(toNumber(point.values.max_cpu_usage)),
      ramUsage: clampPercentage(toNumber(point.values.ram_usage)),
      diskIoConsumption: clampPercentage(toNumber(point.values.disk_io_consumption)),
    }))

    const diskChartData = usageData.data.flatMap((point) => {
      const databaseBytes = toNumber(point.values.pg_database_size)
      const walBytes = toNumber(point.values.disk_fs_used_wal)
      const systemBytes = toNumber(point.values.disk_fs_used_system)
      const totalBytes = toNumber(point.values.disk_fs_size)
      if (totalBytes <= 0) return []

      return {
        timestamp: point.period_start,
        databaseBytes,
        walBytes,
        systemBytes,
        diskSizeBytes: totalBytes,
        databaseUsagePercent: clampPercentage((databaseBytes / totalBytes) * 100),
        walUsagePercent: clampPercentage((walBytes / totalBytes) * 100),
        systemUsagePercent: clampPercentage((systemBytes / totalBytes) * 100),
      }
    })

    return { computeChartData, diskChartData }
  }, [usageData])

  const peakCpuUsage = getPeakChartValue(computeChartData, 'maxCpuUsage')
  const peakMemoryUsage = getPeakChartValue(computeChartData, 'ramUsage')
  const peakDiskIoUsage = getPeakChartValue(computeChartData, 'diskIoConsumption')
  const computePeaks = [peakCpuUsage, peakMemoryUsage, peakDiskIoUsage].filter(
    (value): value is number => value !== undefined
  )
  const peakComputeUsage = computePeaks.length > 0 ? Math.max(...computePeaks) : undefined

  const latestDiskDataPoint = diskChartData[diskChartData.length - 1]
  const latestDiskUsedBytes =
    (latestDiskDataPoint?.databaseBytes ?? 0) +
    (latestDiskDataPoint?.walBytes ?? 0) +
    (latestDiskDataPoint?.systemBytes ?? 0)
  const latestDiskSizeBytes = latestDiskDataPoint?.diskSizeBytes ?? 0
  const latestDiskUsage =
    latestDiskSizeBytes > 0
      ? clampPercentage((latestDiskUsedBytes / latestDiskSizeBytes) * 100)
      : undefined

  const databaseReportUrl = `/project/${projectRef}/observability/database`
  const chartActions = [
    {
      label: 'View database report',
      href: databaseReportUrl,
      icon: <ExternalLink size={12} />,
    },
  ]

  const isComputeEmpty = computeChartData.length === 0
  const isDiskEmpty = diskChartData.length === 0

  return (
    <div className={cn('grid grid-cols-1 gap-4 @xl:grid-cols-2 @xl:items-stretch', className)}>
      <div id="cpu" className="scroll-mt-24 h-full min-h-0">
        <Chart isLoading={isLoading} isErrored={isError} className="h-full">
          <ChartCard className="h-full flex flex-col">
            <ChartHeader align="start" className="min-h-[5.5rem]">
              <ChartMetric
                label="Compute utilization"
                tooltip="Peak CPU, memory, and disk IO usage over the last 7 days. Sustained high usage may require a larger compute size."
                value={formatUsagePercent(peakComputeUsage)}
                status={getWorstUsageMetricStatus(peakCpuUsage, peakMemoryUsage, peakDiskIoUsage)}
              />
              <div className="flex flex-wrap items-center gap-6">
                <ChartMetric
                  label="CPU"
                  tooltip="Highest daily CPU usage"
                  value={formatUsagePercent(peakCpuUsage)}
                  status={getUsageMetricStatus(peakCpuUsage)}
                  align="end"
                />
                <ChartMetric
                  label="Memory"
                  tooltip="Highest daily memory usage"
                  value={formatUsagePercent(peakMemoryUsage)}
                  status={getUsageMetricStatus(peakMemoryUsage)}
                  align="end"
                />
                <ChartMetric
                  label="Disk IO"
                  tooltip="Highest daily disk IO consumption"
                  value={formatUsagePercent(peakDiskIoUsage)}
                  status={getUsageMetricStatus(peakDiskIoUsage)}
                  align="end"
                />
                <ChartActions actions={chartActions} />
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
                  data={computeChartData as ChartLineTick[]}
                  dataKey="maxCpuUsage"
                  dataKeys={['maxCpuUsage', 'ramUsage', 'diskIoConsumption']}
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

      <div id="disk" className="scroll-mt-24 h-full min-h-0">
        <Chart isLoading={isLoading} isErrored={isError} className="h-full">
          <ChartCard className="h-full flex flex-col">
            <ChartHeader align="start" className="min-h-[5.5rem]">
              <ChartMetric
                label="Disk usage"
                tooltip="Provisioned disk and used disk split by database, WAL, and system usage over the last 7 days."
                value={formatUsagePercent(latestDiskUsage)}
                status={getUsageMetricStatus(latestDiskUsage)}
              />
              <div className="flex flex-wrap items-center gap-6">
                <ChartMetric
                  label="Database"
                  tooltip="Database storage used"
                  value={formatBytes(latestDiskDataPoint?.databaseBytes ?? 0, 1)}
                  align="end"
                />
                <ChartMetric
                  label="WAL"
                  tooltip="Write-ahead log storage used"
                  value={formatBytes(latestDiskDataPoint?.walBytes ?? 0, 1)}
                  align="end"
                />
                <ChartMetric
                  label="System"
                  tooltip="System storage used"
                  value={formatBytes(latestDiskDataPoint?.systemBytes ?? 0, 1)}
                  align="end"
                />
                <ChartActions actions={chartActions} />
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
                  data={diskChartData as ChartLineTick[]}
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
