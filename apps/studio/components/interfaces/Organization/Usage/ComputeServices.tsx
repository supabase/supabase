import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BarChart2Icon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
  ChartTitle,
  type ChartConfig,
} from 'ui-patterns/Chart'

import { SectionContent } from './SectionContent'
import { COMPUTE_ALLOWANCE_WARNING_THRESHOLD } from '@/components/interfaces/Compute/Compute.limits'
import { formatSize } from '@/components/interfaces/Compute/Compute.utils'
import {
  aggregateUsageBySize,
  buildComputeBurndown,
  formatComputeHours,
  formatComputeRequests,
  formatGbHours,
  formatPercentage,
  formatVcpuHours,
  getCpuUtilization,
  getUsageConcentration,
  sumBy,
} from '@/components/interfaces/Compute/ComputeUsage.utils'
import type {
  ComputeBurndown,
  ComputeUsageByProject,
  ComputeUsageBySize,
} from '@/components/interfaces/Compute/ComputeUsage.utils'
import { useComputeLimits } from '@/components/interfaces/Compute/useComputeLimits'
import { SparkBar } from '@/components/ui/SparkBar'
import { computeOrgUsageQueryOptions } from '@/data/compute/compute-usage-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

const USAGE_WINDOW_DAYS = 30

const burndownConfig = {
  used: { label: 'vCPU-hours reserved' },
} satisfies ChartConfig

const utilizationConfig = {
  usedVcpuHours: { label: 'CPU used' },
  idleVcpuHours: { label: 'Reserved, idle' },
} satisfies ChartConfig

export interface ComputeServicesProps {
  orgSlug: string
  projectRef?: string | null
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected?: boolean
}

export const ComputeServices = ({
  orgSlug,
  projectRef,
  subscription,
  currentBillingCycleSelected = true,
}: ComputeServicesProps) => {
  const { data, isPending, isError } = useQuery(
    computeOrgUsageQueryOptions({ orgSlug, projectRef, days: USAGE_WINDOW_DAYS })
  )

  const { limits, limitsLabel, noLimitLabel } = useComputeLimits(subscription?.plan)
  const points = data?.points ?? []
  const byProject = data?.byProject ?? []
  const bySize = aggregateUsageBySize(data?.instanceRows ?? [])
  const burndown = buildComputeBurndown(
    points,
    (point) => point.reservedVcpuHours,
    limits.vcpuHours,
    COMPUTE_ALLOWANCE_WARNING_THRESHOLD
  )
  const memoryBurndown = buildComputeBurndown(
    points,
    (point) => point.gbHours,
    limits.gbHours,
    COMPUTE_ALLOWANCE_WARNING_THRESHOLD
  )

  const isEmpty = !isPending && points.length === 0
  const totalRunningHours = sumBy(points, (point) => point.runningHours)
  const totalReservedVcpuHours = sumBy(points, (point) => point.reservedVcpuHours)
  const totalUsedVcpuHours = sumBy(points, (point) => point.usedVcpuHours)
  const totalRequests = sumBy(points, (point) => point.requests)
  const cpuUtilization = getCpuUtilization(totalUsedVcpuHours, totalReservedVcpuHours)
  const concentration = getUsageConcentration(byProject.map((row) => row.reservedVcpuHours))
  const utilizationData = points.map((point) => ({
    timestamp: point.timestamp,
    usedVcpuHours: point.usedVcpuHours,
    idleVcpuHours: Number(Math.max(0, point.reservedVcpuHours - point.usedVcpuHours).toFixed(2)),
  }))

  const burndownStatus =
    burndown.status === 'exhausted'
      ? ('negative' as const)
      : burndown.status === 'warning'
        ? ('warning' as const)
        : ('default' as const)

  const isOverThreshold = burndown.status === 'warning' || burndown.status === 'exhausted'
  const burndownInkClassName = isOverThreshold
    ? 'fill-warning stroke-warning'
    : 'fill-foreground stroke-foreground'

  return (
    <div id="compute-services" className="scroll-my-12">
      <SectionContent
        section={{
          name: 'Compute',
          description:
            'Usage across every compute in the organization, counted on the vCPU and memory instances reserve while running.\nSuspended instances reserve nothing. Compute is in alpha and these figures are estimates. Nothing here is billed yet.',
          links: [],
        }}
      >
        <div className="space-y-6">
          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <div className="flex flex-col gap-1">
                  <ChartTitle
                    className="text-sm"
                    tooltip="vCPU reserved by running instances this period, against the plan allowance."
                  >
                    vCPU-hours
                  </ChartTitle>
                  <p className="text-sm text-foreground-light">
                    {burndown.allowance === null
                      ? `${formatVcpuHours(burndown.used)} used`
                      : `${formatVcpuHours(burndown.used)} of ${formatVcpuHours(burndown.allowance)} used`}
                  </p>
                </div>
                <ChartMetric
                  align="end"
                  label="Remaining"
                  status={burndownStatus}
                  value={
                    burndown.remaining === null ? 'No limit' : formatVcpuHours(burndown.remaining)
                  }
                />
              </ChartHeader>
              <ChartContent
                isEmpty={isEmpty}
                loadingState={<ChartLoadingState />}
                errorState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load Compute usage for this organization"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="No Compute usage yet"
                    description="Deploy an instance to start tracking usage"
                  />
                }
              >
                <ChartContainer config={burndownConfig} className="h-56 w-full">
                  <AreaChart
                    data={burndown.points}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      className="stroke-border-stronger"
                    />
                    <XAxis
                      dataKey="timestamp"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={32}
                      tickFormatter={(value) => dayjs(value).format('DD MMM')}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      className="text-xs"
                      domain={[
                        0,
                        (dataMax: number) =>
                          Math.ceil(Math.max(dataMax, burndown.allowance ?? 0) * 1.1),
                      ]}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => dayjs(value).format('DD MMM YYYY')}
                        />
                      }
                    />
                    {burndown.warningAt !== null && (
                      <ReferenceLine
                        y={burndown.warningAt}
                        stroke="var(--chart-status-warning)"
                        strokeDasharray="4 4"
                      />
                    )}
                    {burndown.allowance !== null && (
                      <ReferenceLine y={burndown.allowance} stroke="var(--chart-reference)" />
                    )}
                    <Area
                      dataKey="used"
                      type="monotone"
                      className={burndownInkClassName}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>

                <ComputeBurndownLegend burndown={burndown} noLimitLabel={noLimitLabel} />

                <ComputeAllowanceBreakdown
                  rows={[
                    { label: 'vCPU-hours', burndown, format: formatVcpuHours },
                    { label: 'GB-hours', burndown: memoryBurndown, format: formatGbHours },
                  ]}
                  limitsLabel={limitsLabel}
                  currentBillingCycleSelected={currentBillingCycleSelected}
                />
              </ChartContent>
            </ChartCard>
          </Chart>

          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <div className="flex flex-col gap-1">
                  <ChartTitle
                    className="text-sm"
                    tooltip="CPU instances actually used, against the vCPU they reserved while running."
                  >
                    CPU utilization
                  </ChartTitle>
                  <p className="text-sm text-foreground-light">
                    {formatVcpuHours(totalUsedVcpuHours)} used of{' '}
                    {formatVcpuHours(totalReservedVcpuHours)} reserved
                  </p>
                </div>
                <ChartMetric
                  align="end"
                  label="Idle"
                  value={formatVcpuHours(Math.max(0, totalReservedVcpuHours - totalUsedVcpuHours))}
                  tooltip="Reserved vCPU-hours that did no work. Active-CPU billing would not charge for these."
                />
              </ChartHeader>
              <ChartContent
                isEmpty={isEmpty}
                loadingState={<ChartLoadingState />}
                errorState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load CPU utilization"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="No CPU usage yet"
                    description="Deploy an instance to see how much of its vCPU it uses"
                  />
                }
              >
                <ChartContainer config={utilizationConfig} className="h-44 w-full">
                  <AreaChart
                    data={utilizationData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      className="stroke-border-stronger"
                    />
                    <XAxis
                      dataKey="timestamp"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={32}
                      tickFormatter={(value) => dayjs(value).format('DD MMM')}
                      className="text-xs"
                    />
                    <YAxis tickLine={false} axisLine={false} width={48} className="text-xs" />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => dayjs(value).format('DD MMM YYYY')}
                        />
                      }
                    />
                    <Area
                      dataKey="usedVcpuHours"
                      type="monotone"
                      stackId="cpu"
                      className="fill-foreground stroke-foreground"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="idleVcpuHours"
                      type="monotone"
                      stackId="cpu"
                      className="fill-foreground-muted stroke-foreground-muted"
                      fillOpacity={0.1}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ChartContainer>
                <p className="mt-3 text-xs text-foreground-lighter">
                  {cpuUtilization === null
                    ? 'No vCPU reserved in this period.'
                    : `${formatPercentage(cpuUtilization)} of reserved vCPU did work. Billing is on reserved vCPU during alpha.`}
                </p>
              </ChartContent>
            </ChartCard>
          </Chart>

          {/* Instance hours by size — the same h-1 meter the rest of the usage page uses */}
          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <div className="flex flex-col gap-1">
                  <ChartTitle
                    className="text-sm"
                    tooltip="Running hours split by instance size. Larger sizes reserve more vCPU and memory per hour."
                  >
                    Running hours by size
                  </ChartTitle>
                  <p className="text-sm text-foreground-light">
                    {formatComputeHours(totalRunningHours)} this period
                  </p>
                </div>
              </ChartHeader>
              <ChartContent
                isEmpty={!isPending && bySize.length === 0}
                loadingState={<ChartLoadingState />}
                errorState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load running hours"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="No running hours yet"
                    description="Deploy a compute to see usage by size"
                  />
                }
              >
                <ComputeSizeMeters rows={bySize} />
              </ChartContent>
            </ChartCard>
          </Chart>

          {/* Per-project breakdown */}
          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <div className="flex flex-col gap-1">
                  <ChartTitle
                    className="text-sm"
                    tooltip="Computes, instances and reserved vCPU attributed to each project."
                  >
                    Usage by project
                  </ChartTitle>
                  <p className="text-sm text-foreground-light">
                    {formatComputeRequests(totalRequests)} requests ·{' '}
                    {Math.round(concentration * 100)}% from the largest project
                  </p>
                </div>
              </ChartHeader>
              <ChartContent
                className="p-0"
                isEmpty={!isPending && byProject.length === 0}
                loadingState={<ChartLoadingState className="m-card" />}
                errorState={
                  <ChartEmptyState
                    className="m-card"
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load usage by project"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    className="m-card"
                    icon={<BarChart2Icon size={16} />}
                    title="No projects using Compute"
                    description="Deploy an instance to see it listed here"
                  />
                }
              >
                <ComputeProjectTable rows={byProject} />
              </ChartContent>
            </ChartCard>
          </Chart>
        </div>
      </SectionContent>
    </div>
  )
}

interface AllowanceRow {
  label: string
  burndown: ComputeBurndown
  format: (value: number) => string
}

const ComputeAllowanceBreakdown = ({
  rows,
  limitsLabel,
  currentBillingCycleSelected,
}: {
  rows: AllowanceRow[]
  limitsLabel: string
  currentBillingCycleSelected: boolean
}) => (
  <div className="mt-4 divide-y">
    {rows.map(({ label, burndown, format }) => {
      const overage =
        burndown.allowance === null ? null : Math.max(0, burndown.used - burndown.allowance)

      return (
        <div key={label} className="py-1">
          <div className="flex items-center justify-between py-1">
            <p className="text-xs text-foreground-light">
              {label} included in {limitsLabel}
            </p>
            <p className="text-xs">
              {burndown.allowance === null ? 'Unlimited' : format(burndown.allowance)}
            </p>
          </div>
          {currentBillingCycleSelected && (
            <div className="flex items-center justify-between py-1">
              <p className="text-xs text-foreground-light">{label} used in period</p>
              <p className="text-xs">{format(burndown.used)}</p>
            </div>
          )}
          {currentBillingCycleSelected && overage !== null && (
            <div className="flex items-center justify-between py-1">
              <p className="text-xs text-foreground-light">{label} overage in period</p>
              <p className="text-xs">{format(overage)}</p>
            </div>
          )}
        </div>
      )
    })}
  </div>
)

const ComputeBurndownLegend = ({
  burndown,
  noLimitLabel,
}: {
  burndown: ComputeBurndown
  noLimitLabel: string
}) => {
  if (burndown.allowance === null) {
    return (
      <p className="mt-3 text-xs text-foreground-lighter">
        vCPU-hours reserved over the period. {noLimitLabel}.
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5">
      <LegendItem className="bg-foreground" label="Used" />
      {burndown.warningAt !== null && (
        <LegendItem
          className="bg-warning"
          isDashed
          label={`${formatPercentage(COMPUTE_ALLOWANCE_WARNING_THRESHOLD)} threshold · ${formatVcpuHours(burndown.warningAt)}`}
        />
      )}
      <LegendItem
        className="bg-foreground-muted"
        label={`Plan limit · ${formatVcpuHours(burndown.allowance)}`}
      />
    </div>
  )
}

const LegendItem = ({
  className,
  label,
  isDashed,
}: {
  className: string
  label: string
  isDashed?: boolean
}) => (
  <span className="flex items-center gap-2 text-xs text-foreground-light">
    <span
      aria-hidden
      className={cn('h-px w-4 shrink-0', className, isDashed && 'opacity-80')}
      style={
        isDashed
          ? { maskImage: 'repeating-linear-gradient(90deg,#000 0 4px,transparent 4px 7px)' }
          : undefined
      }
    />
    {label}
  </span>
)

const ComputeSizeMeters = ({ rows }: { rows: ComputeUsageBySize[] }) => {
  const totalRunningHours = sumBy(rows, (row) => row.runningHours)

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <SparkBar
          key={row.size}
          type="horizontal"
          barClass="bg-foreground-light"
          bgClass="bg-surface-300"
          value={row.runningHours}
          max={totalRunningHours || 1}
          labelBottom={formatSize(row.size)}
          labelTop={formatComputeHours(row.runningHours)}
        />
      ))}
    </div>
  )
}

const ComputeProjectTable = ({ rows }: { rows: ComputeUsageByProject[] }) => {
  const totalReservedVcpuHours = sumBy(rows, (row) => row.reservedVcpuHours)

  return (
    <div className="divide-y">
      <div className="grid grid-cols-12 gap-2 px-card py-2 text-xs font-mono uppercase text-foreground-lighter">
        <span className="col-span-3">Project</span>
        <span className="col-span-1 text-right">Computes</span>
        <span className="col-span-1 text-right">Instances</span>
        <span className="col-span-2 text-right">vCPU-hrs</span>
        <span className="col-span-2 text-right">CPU used</span>
        <span className="col-span-1 text-right">Requests</span>
        <span className="col-span-2 text-right">Share</span>
      </div>
      {rows.map((row) => {
        const share =
          totalReservedVcpuHours <= 0 ? 0 : row.reservedVcpuHours / totalReservedVcpuHours
        const cpuUtilization = getCpuUtilization(row.usedVcpuHours, row.reservedVcpuHours)
        return (
          <div key={row.projectRef} className="grid grid-cols-12 items-center gap-2 px-card py-2.5">
            <span className="col-span-3 truncate text-sm text-foreground">{row.projectName}</span>
            <span className="col-span-1 text-right text-sm tabular-nums text-foreground-light">
              {row.deployments}
            </span>
            <span className="col-span-1 text-right text-sm tabular-nums text-foreground-light">
              {row.instances}
            </span>
            <span className="col-span-2 text-right text-sm tabular-nums text-foreground-light">
              {formatVcpuHours(row.reservedVcpuHours)}
            </span>
            <span className="col-span-2 text-right text-sm tabular-nums text-foreground-light">
              {cpuUtilization === null ? '—' : formatPercentage(cpuUtilization)}
            </span>
            <span className="col-span-1 text-right text-sm tabular-nums text-foreground-light">
              {formatComputeRequests(row.requests)}
            </span>
            <span className="col-span-2 flex items-center justify-end gap-2">
              <span
                aria-hidden
                className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-surface-300 sm:block"
              >
                <span
                  className="block h-full rounded-full bg-foreground"
                  style={{ width: `${Math.round(share * 100)}%` }}
                />
              </span>
              <span className="text-sm tabular-nums text-foreground-light">
                {Math.round(share * 100)}%
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
