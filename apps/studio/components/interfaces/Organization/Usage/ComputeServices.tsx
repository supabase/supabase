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
import { useComputeOrgUsage } from '@/data/compute/use-compute-org-usage'
import type { OrgSubscription } from '@/data/subscriptions/types'

const USAGE_WINDOW_DAYS = 30

/**
 * Wall-clock runtime and GB-hours carry no quota of their own. Runtime is context — how long
 * instances were up — and memory tracks vCPU at a fixed 2 GB per vCPU, so neither can diverge
 * from the metered figure. Both are reported rather than metered.
 */
/** Label left, figure right. The one line a section gets in place of a prose subtitle. */
const TotalRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b py-1">
    <p className="text-xs text-foreground-light">{label}</p>
    <p className="text-xs tabular-nums">{value}</p>
  </div>
)

const ComputeBillingDimensions = ({
  runningHours,
  gbHours,
}: {
  runningHours: number
  gbHours: number
}) => (
  <div>
    <div className="flex items-center justify-between border-b py-1">
      <p className="text-xs text-foreground-light">Runtime in period</p>
      <p className="text-xs">{formatComputeHours(runningHours)}</p>
    </div>
    <div className="flex items-center justify-between py-1">
      <p className="text-xs text-foreground-light">GB-hours in period</p>
      <p className="text-xs">{formatGbHours(gbHours)}</p>
    </div>
    <p className="pt-1 text-xs text-foreground-lighter">
      Usage beyond the included quota is priced per vCPU-hour and GB-hour.
    </p>
  </div>
)

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
  const { data, error, isPending, isError, isSuccess } = useComputeOrgUsage({
    orgSlug,
    projectRef,
    days: USAGE_WINDOW_DAYS,
  })

  const { limits, limitsLabel, noLimitLabel } = useComputeLimits(subscription?.plan)
  const points = data?.points ?? []
  const byProject = data?.byProject ?? []
  const bySize = aggregateUsageBySize(data?.instanceRows ?? [])

  // The quota is vCPU-hours, so it is measured against reserved vCPU rather than wall-clock
  // runtime: a 2 vCPU instance consumes it twice as fast.
  const quotaBurndown = buildComputeBurndown(
    points,
    (point) => point.reservedVcpuHours,
    limits.vcpuHours,
    COMPUTE_ALLOWANCE_WARNING_THRESHOLD
  )

  const totalRunningHours = sumBy(points, (point) => point.runningHours)
  const totalReservedVcpuHours = sumBy(points, (point) => point.reservedVcpuHours)
  const totalUsedVcpuHours = sumBy(points, (point) => point.usedVcpuHours)
  const totalGbHours = sumBy(points, (point) => point.gbHours)
  const totalRequests = sumBy(points, (point) => point.requests)
  const cpuUtilization = getCpuUtilization(totalUsedVcpuHours, totalReservedVcpuHours)
  const hasVcpuUsage = totalReservedVcpuHours > 0

  const vcpuChartData: DataPoint[] = points.map((point) => ({
    period_start: point.timestamp,
    periodStartFormatted: dayjs(point.timestamp).format('DD MMM'),
    usedVcpuHours: Number(point.usedVcpuHours.toFixed(2)),
    idleVcpuHours: Number(Math.max(0, point.reservedVcpuHours - point.usedVcpuHours).toFixed(2)),
  }))

  return (
    <div id="compute-services" className="scroll-my-12">
      <SectionContent
        section={{
          name: 'Compute',
          description:
            'Usage across every compute in the organization. The included quota is counted in vCPU-hours, so a larger instance consumes it faster than a smaller one running just as long. Suspended instances accrue nothing.\nUsage beyond the quota is priced per vCPU-hour and GB-hour. Compute is in alpha and these figures are estimates. Nothing here is billed yet.',
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
                  name="Compute"
                  burndown={quotaBurndown}
                  format={formatVcpuHours}
                  limitsLabel={limitsLabel}
                  noLimitLabel={noLimitLabel}
                  isUsageBillingEnabled={subscription?.usage_billing_enabled ?? false}
                  currentBillingCycleSelected={currentBillingCycleSelected}
                />
                <ComputeBillingDimensions runningHours={totalRunningHours} gbHours={totalGbHours} />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm">vCPU-hours per day</p>
              <div>
                <TotalRow label="Total reserved" value={formatVcpuHours(totalReservedVcpuHours)} />
                <TotalRow label="CPU used" value={formatVcpuHours(totalUsedVcpuHours)} />
                {cpuUtilization !== null && (
                  <TotalRow
                    label="Share of reserved that did work"
                    value={formatPercentage(cpuUtilization)}
                  />
                )}
              </div>
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

            <div className="space-y-2">
              <p className="text-sm">Running hours by size</p>
              <TotalRow label="Total running hours" value={formatComputeHours(totalRunningHours)} />
            </div>
            {bySize.length > 0 ? <ComputeSizeMeters rows={bySize} /> : <NoComputeUsage />}

            <div className="space-y-2">
              <p className="text-sm">Usage by project</p>
              <div>
                <TotalRow label="Projects with usage" value={byProject.length.toLocaleString()} />
                <TotalRow label="Total requests" value={formatComputeRequests(totalRequests)} />
              </div>
            </div>
            {byProject.length > 0 ? <ComputeProjectTable rows={byProject} /> : <NoComputeUsage />}
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

const pluralize = (count: number, singular: string) =>
  `${count.toLocaleString()} ${singular}${count === 1 ? '' : 's'}`

const ComputeProjectTable = ({ rows }: { rows: ComputeUsageByProject[] }) => {
  const totalReservedVcpuHours = sumBy(rows, (row) => row.reservedVcpuHours)

  return (
    <div className="divide-y border-b">
      <div className="grid grid-cols-12 gap-4 py-2 text-xs font-mono uppercase text-foreground-lighter">
        <span className="col-span-6">Project</span>
        <span className="col-span-4 text-right">vCPU-hrs</span>
        <span className="col-span-2 text-right">CPU used</span>
      </div>
      {rows.map((row) => {
        const share =
          totalReservedVcpuHours <= 0 ? 0 : row.reservedVcpuHours / totalReservedVcpuHours
        const cpuUtilization = getCpuUtilization(row.usedVcpuHours, row.reservedVcpuHours)

        return (
          <div key={row.projectRef} className="grid grid-cols-12 items-center gap-4 py-1.5">
            <div className="col-span-6 min-w-0">
              <p className="truncate text-sm text-foreground">{row.projectName}</p>
              <p className="truncate text-xs text-foreground-lighter">
                {pluralize(row.deployments, 'compute')} · {pluralize(row.instances, 'instance')}
              </p>
            </div>
            <div className="col-span-4 flex flex-col items-end gap-1">
              <p className="text-sm tabular-nums text-foreground-light">
                {formatVcpuHours(row.reservedVcpuHours)}
              </p>
              <div
                className="flex items-center gap-2"
                aria-label={`${formatPercentage(share)} of organization vCPU-hours`}
              >
                <span aria-hidden className="h-1 w-12 overflow-hidden rounded-full bg-surface-400">
                  <span
                    className="block h-full rounded-full bg-foreground-light"
                    style={{ width: formatPercentage(share) }}
                  />
                </span>
                <span className="text-xs tabular-nums text-foreground-lighter">
                  {formatPercentage(share)}
                </span>
              </div>
            </div>
            <p className="col-span-2 text-right text-sm tabular-nums text-foreground-light">
              {cpuUtilization === null ? '—' : formatPercentage(cpuUtilization)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
