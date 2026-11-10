import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import type { ReactNode } from 'react'
import type { ChartConfig } from 'ui'
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
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import type { ComputeInstance } from '../Compute.types'
import {
  formatComputeRequests,
  formatPercentage,
  getCpuUtilization,
  sumBy,
} from '../ComputeUsage.utils'
import { computeInstanceUsageQueryOptions } from '@/data/compute/compute-usage-query'

const USAGE_WINDOW_DAYS = 30
const DATE_TIME_FORMAT = 'MMM D, YYYY'

/**
 * Reserved sits behind used so the gap between the two lines reads as idle: vCPU that was
 * held and billed without doing work. A stacked bar hid that in the total.
 */
const CPU_CHART_CONFIG = {
  reservedVcpuHours: { label: 'Reserved', color: 'var(--foreground-muted)' },
  usedVcpuHours: { label: 'CPU used', color: 'var(--primary-bright)' },
} satisfies ChartConfig

const MEMORY_CHART_CONFIG = {
  gbHours: { label: 'Memory', color: 'var(--primary-bright)' },
} satisfies ChartConfig

/** One decimal, or two below an hour, so sub-hour days do not all read as zero. */
const metricValue = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: value < 1 ? 2 : 1 })

interface ComputeInstanceUsageSectionProps {
  instance: ComputeInstance
}

export const ComputeInstanceUsageSection = ({ instance }: ComputeInstanceUsageSectionProps) => {
  const { ref: projectRef } = useParams()

  const { data, isPending, isError } = useQuery(
    computeInstanceUsageQueryOptions({
      projectRef,
      name: instance.name,
      size: instance.size,
      instances: instance.declaredInstances,
      days: USAGE_WINDOW_DAYS,
    })
  )

  const points = data?.points ?? []

  const totalRunningHours = sumBy(points, (point) => point.runningHours)
  const totalReservedVcpuHours = sumBy(points, (point) => point.reservedVcpuHours)
  const totalUsedVcpuHours = sumBy(points, (point) => point.usedVcpuHours)
  const totalGbHours = sumBy(points, (point) => point.gbHours)
  const totalRequests = sumBy(points, (point) => point.requests)
  const cpuUtilization = getCpuUtilization(totalUsedVcpuHours, totalReservedVcpuHours)

  const chartData = points.map((point) => ({
    timestamp: point.timestamp,
    reservedVcpuHours: Number(point.reservedVcpuHours.toFixed(2)),
    usedVcpuHours: Number(point.usedVcpuHours.toFixed(2)),
    gbHours: Number(point.gbHours.toFixed(2)),
  }))

  // Units live on the metric label and the axis, not repeated in the figure.
  const cpuMetrics = (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <ChartMetric
        label="vCPU-hours"
        value={metricValue(totalReservedVcpuHours)}
        tooltip="Running hours multiplied by the vCPU each instance size reserves. This is what the quota counts."
      />
      <ChartMetric
        label="CPU used"
        value={cpuUtilization === null ? '—' : formatPercentage(cpuUtilization)}
        tooltip="Share of reserved vCPU that did work. The rest was idle, e.g. waiting on I/O."
      />
      <ChartMetric
        label="Running hours"
        value={metricValue(totalRunningHours)}
        tooltip="Hours this compute's instances were running, busy or idle, rather than suspended."
      />
    </div>
  )

  const memoryMetrics = (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <ChartMetric
        label="GB-hours"
        value={metricValue(totalGbHours)}
        tooltip="Running hours multiplied by the memory each instance size reserves. Fixed at 2 GB per vCPU, so it tracks CPU rather than moving on its own."
      />
      <ChartMetric
        label="Requests"
        value={formatComputeRequests(totalRequests)}
        tooltip="Requests handled across every instance of this compute."
      />
    </div>
  )

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Usage</PageSectionTitle>
          <PageSectionDescription>
            What this compute's instances consumed over the last {USAGE_WINDOW_DAYS} days. Figures
            are estimates while Compute is in alpha.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        {/*
          Stacked rather than side by side. Edge Functions pairs these in two columns, but its
          charts carry a single series over short intervals; these carry a month of daily
          points, and two series on the CPU one, which a half-width column crushes.
        */}
        <div className="space-y-6">
          <UsageChartCard
            metrics={cpuMetrics}
            data={chartData}
            dataKey="reservedVcpuHours"
            dataKeys={['reservedVcpuHours', 'usedVcpuHours']}
            config={CPU_CHART_CONFIG}
            isLoading={isPending}
            isError={isError}
            subject="CPU usage"
          />
          <UsageChartCard
            metrics={memoryMetrics}
            data={chartData}
            dataKey="gbHours"
            config={MEMORY_CHART_CONFIG}
            isLoading={isPending}
            isError={isError}
            subject="memory usage"
          />
        </div>
      </PageSectionContent>
    </PageSection>
  )
}

interface UsageChartCardProps {
  metrics: ReactNode
  data: { timestamp: string }[]
  dataKey: string
  dataKeys?: string[]
  config: ChartConfig
  isLoading: boolean
  isError: boolean
  subject: string
}

const UsageChartCard = ({
  metrics,
  data,
  dataKey,
  dataKeys,
  config,
  isLoading,
  isError,
  subject,
}: UsageChartCardProps) => (
  <Chart isLoading={isLoading}>
    <ChartCard>
      <ChartHeader align="start">{metrics}</ChartHeader>
      <ChartContent
        isEmpty={isError || data.length === 0}
        loadingState={<ChartLoadingState />}
        emptyState={
          <ChartEmptyState
            title={isError ? `Unable to load ${subject}` : 'No data to show'}
            description={
              isError ? undefined : 'Usage appears once the instance starts serving requests'
            }
          />
        }
      >
        <div className="h-40">
          <ChartLine
            data={data}
            dataKey={dataKey}
            dataKeys={dataKeys}
            DateTimeFormat={DATE_TIME_FORMAT}
            isFullHeight
            showYAxis
            config={config}
            YAxisProps={{
              // Bare numbers: the metric label above the chart already names the unit, and
              // repeating it on every tick costs width the plot needs more.
              tickFormatter: (value: number) => metricValue(value),
              width: 40,
            }}
          />
        </div>
      </ChartContent>
    </ChartCard>
  </Chart>
)
