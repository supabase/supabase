import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { AlertTriangleIcon, BarChart2Icon } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { SectionContent } from './SectionContent'
import type { Attribute } from './Usage.constants'
import { ChartTooltipValueFormatter, ChartYFormatterCompactNumber } from './Usage.utils'
import UsageBarChart from './UsageBarChart'
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
import { AlertError } from '@/components/ui/AlertError'
import Panel from '@/components/ui/Panel'
import { SparkBar } from '@/components/ui/SparkBar'
import type { DataPoint } from '@/data/analytics/constants'
import { computeOrgUsageQueryOptions } from '@/data/compute/compute-usage-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

const USAGE_WINDOW_DAYS = 30

const VCPU_CHART_ATTRIBUTES: Attribute[] = [
  { key: 'usedVcpuHours', name: 'CPU used', color: 'white' },
  { key: 'idleVcpuHours', name: 'Reserved, idle', color: 'muted' },
]

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
  const { data, error, isPending, isError, isSuccess } = useQuery(
    computeOrgUsageQueryOptions({ orgSlug, projectRef, days: USAGE_WINDOW_DAYS })
  )

  const { limits, limitsLabel, noLimitLabel } = useComputeLimits(subscription?.plan)
  const points = data?.points ?? []
  const byProject = data?.byProject ?? []
  const bySize = aggregateUsageBySize(data?.instanceRows ?? [])

  const vcpuBurndown = buildComputeBurndown(
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

  const totalRunningHours = sumBy(points, (point) => point.runningHours)
  const totalReservedVcpuHours = sumBy(points, (point) => point.reservedVcpuHours)
  const totalUsedVcpuHours = sumBy(points, (point) => point.usedVcpuHours)
  const totalRequests = sumBy(points, (point) => point.requests)
  const cpuUtilization = getCpuUtilization(totalUsedVcpuHours, totalReservedVcpuHours)
  const concentration = getUsageConcentration(byProject.map((row) => row.reservedVcpuHours))
  const hasVcpuUsage = totalReservedVcpuHours > 0

  const vcpuChartData: DataPoint[] = points.map((point) => ({
    period_start: point.timestamp,
    periodStartFormatted: dayjs(point.timestamp).format('DD MMM'),
    usedVcpuHours: point.usedVcpuHours,
    idleVcpuHours: Number(Math.max(0, point.reservedVcpuHours - point.usedVcpuHours).toFixed(2)),
  }))

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
        {isPending && <GenericSkeletonLoader />}

        {isError && <AlertError subject="Failed to retrieve Compute usage" error={error} />}

        {isSuccess && (
          <>
            {!projectRef && (
              <div className="space-y-6">
                <ComputeAllowanceSummary
                  name="vCPU-hours"
                  burndown={vcpuBurndown}
                  format={formatVcpuHours}
                  limitsLabel={limitsLabel}
                  noLimitLabel={noLimitLabel}
                  isUsageBillingEnabled={subscription?.usage_billing_enabled ?? false}
                  currentBillingCycleSelected={currentBillingCycleSelected}
                />
                <ComputeAllowanceSummary
                  name="GB-hours"
                  burndown={memoryBurndown}
                  format={formatGbHours}
                  limitsLabel={limitsLabel}
                  noLimitLabel={noLimitLabel}
                  isUsageBillingEnabled={subscription?.usage_billing_enabled ?? false}
                  currentBillingCycleSelected={currentBillingCycleSelected}
                />
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm">vCPU-hours per day</p>
              <p className="text-sm text-foreground-light">
                Reserved vCPU split into CPU used and idle.
                {cpuUtilization !== null &&
                  ` ${formatPercentage(cpuUtilization)} of reserved vCPU did work this period.`}
              </p>
            </div>
            {hasVcpuUsage ? (
              <UsageBarChart
                name="vCPU-hours"
                unit="hours"
                attributes={VCPU_CHART_ATTRIBUTES}
                data={vcpuChartData}
                yFormatter={(value) => ChartYFormatterCompactNumber(value, 'hours')}
                tooltipFormatter={(value) => ChartTooltipValueFormatter(value, 'hours')}
              />
            ) : (
              <NoComputeUsage />
            )}

            <div className="space-y-1">
              <p className="text-sm">Running hours by size</p>
              <p className="text-sm text-foreground-light">
                {formatComputeHours(totalRunningHours)} this period. Larger sizes reserve more vCPU
                and memory per hour.
              </p>
            </div>
            {bySize.length > 0 ? <ComputeSizeMeters rows={bySize} /> : <NoComputeUsage />}

            <div className="space-y-1">
              <p className="text-sm">Usage by project</p>
              <p className="text-sm text-foreground-light">
                {formatComputeRequests(totalRequests)} requests · {formatPercentage(concentration)}{' '}
                from the largest project
              </p>
            </div>
            {byProject.length > 0 ? (
              <div className="rounded-md border">
                <ComputeProjectTable rows={byProject} />
              </div>
            ) : (
              <NoComputeUsage />
            )}
          </>
        )}
      </SectionContent>
    </div>
  )
}

const NoComputeUsage = () => (
  <Panel>
    <Panel.Content>
      <div className="flex flex-col items-center justify-center">
        <BarChart2Icon className="text-foreground-light mb-2" />
        <p className="text-sm">No data in period</p>
        <p className="text-sm text-foreground-light">Deploy an instance to start tracking usage</p>
      </div>
    </Panel.Content>
  </Panel>
)

interface ComputeAllowanceSummaryProps {
  name: string
  burndown: ComputeBurndown
  format: (value: number) => string
  limitsLabel: string
  noLimitLabel: string
  isUsageBillingEnabled: boolean
  currentBillingCycleSelected: boolean
}

const ComputeAllowanceSummary = ({
  name,
  burndown,
  format,
  limitsLabel,
  noLimitLabel,
  isUsageBillingEnabled,
  currentBillingCycleSelected,
}: ComputeAllowanceSummaryProps) => {
  const { used, allowance, status } = burndown
  const isExceeded = status === 'exhausted'
  const isApproaching = status === 'warning'
  const isRestricted = isExceeded && !isUsageBillingEnabled
  const overage = allowance === null ? null : Math.max(0, used - allowance)
  const shouldShowWarning = currentBillingCycleSelected && (isExceeded || isApproaching)

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <p className="text-sm">{name} usage</p>
        {shouldShowWarning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 cursor-help">
                <AlertTriangleIcon
                  size={14}
                  strokeWidth={2}
                  className={isRestricted ? 'text-destructive' : 'text-warning'}
                />
                <p className={cn('text-sm', isRestricted ? 'text-destructive' : 'text-warning')}>
                  {isExceeded ? 'Exceeded limit' : 'Approaching limit'}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-72">
              {isUsageBillingEnabled
                ? 'Usage beyond the included amount is billed as overage.'
                : 'Instances stop resuming once the included amount is used. Disable the spend cap to keep them running.'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {currentBillingCycleSelected && allowance !== null && (
        <SparkBar
          type="horizontal"
          barClass={cn(
            'bg-foreground-light',
            isApproaching && !isUsageBillingEnabled && 'bg-warning',
            isRestricted && 'bg-destructive'
          )}
          bgClass="bg-surface-300"
          value={Math.min(used, allowance)}
          max={allowance}
        />
      )}

      <div>
        <div className="flex items-center justify-between border-b py-1">
          <p className="text-xs text-foreground-light">Included in {limitsLabel}</p>
          <p className="text-xs">{allowance === null ? 'Unlimited' : format(allowance)}</p>
        </div>
        {currentBillingCycleSelected && (
          <div className="flex items-center justify-between py-1">
            <p className="text-xs text-foreground-light">Used in period</p>
            <p className="text-xs">{format(used)}</p>
          </div>
        )}
        {currentBillingCycleSelected && overage !== null && (
          <div className="flex items-center justify-between border-t py-1">
            <p className="text-xs text-foreground-light">Overage in period</p>
            <p className="text-xs">{format(overage)}</p>
          </div>
        )}
        {allowance === null && (
          <p className="pt-1 text-xs text-foreground-lighter">{noLimitLabel}</p>
        )}
      </div>
    </div>
  )
}

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
