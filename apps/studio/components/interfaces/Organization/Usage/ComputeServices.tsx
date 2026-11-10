import dayjs from 'dayjs'
import { AlertTriangleIcon, BarChart2Icon } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { SectionContent } from './SectionContent'
import type { Attribute } from './Usage.constants'
import { ChartTooltipValueFormatter, ChartYFormatterCompactNumber } from './Usage.utils'
import UsageBarChart from './UsageBarChart'
import { COMPUTE_ALLOWANCE_WARNING_THRESHOLD } from '@/components/interfaces/Compute/Compute.limits'
import {
  COMPUTE_OVERAGE_RATES,
  estimateComputeOverage,
  type ComputeOverageEstimate,
} from '@/components/interfaces/Compute/Compute.pricing'
import { formatSize } from '@/components/interfaces/Compute/Compute.utils'
import {
  aggregateUsageBySize,
  buildComputeBurndown,
  formatComputeHours,
  formatComputeRequests,
  formatDecimal,
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
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { SparkBar } from '@/components/ui/SparkBar'
import type { DataPoint } from '@/data/analytics/constants'
import { useComputeOrgUsage } from '@/data/compute/use-compute-org-usage'
import type { OrgSubscription } from '@/data/subscriptions/types'
import { formatCurrency } from '@/lib/helpers'

const USAGE_WINDOW_DAYS = 30

/** Label left, figure right. The one line a section gets in place of a prose subtitle. */
const TotalRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b py-1">
    <p className="text-xs text-foreground-light">{label}</p>
    <p className="text-xs tabular-nums">{value}</p>
  </div>
)

/** Rates are sub-dollar, so they need cents precision where a total does not. */
const formatRate = (rate: number) => `$${rate.toFixed(2)}`

/**
 * A quantity shown next to the rate it is multiplied by. The usual formatter drops decimals
 * above ten, which leaves "19 vCPU-hrs × $0.15" sitting beside a $2.88 that it does not
 * produce — so a reader checking the arithmetic finds it wrong.
 */
const formatBillableHours = (hours: number) => hours.toFixed(1)

const DimensionRow = ({
  label,
  detail,
  value,
  isTotal = false,
}: {
  label: string
  detail?: string
  value: string
  isTotal?: boolean
}) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 py-1',
      isTotal ? 'border-t' : 'border-b'
    )}
  >
    <p className="text-xs text-foreground-light">
      {label}
      {detail && <span className="ml-2 text-foreground-lighter">{detail}</span>}
    </p>
    <p className={cn('text-xs tabular-nums', isTotal && 'text-foreground')}>{value}</p>
  </div>
)

/**
 * What the period reported, and what the part past the quota would cost.
 *
 * Saying usage is "priced per vCPU-hour and GB-hour" without showing either rate leaves the
 * reader to guess the one number they came for. The breakdown also makes the shape of the
 * bill legible: the quota counts vCPU-hours alone, but the rate card prices memory too, so
 * the same overage is billed on both dimensions at a fixed 2 GB per vCPU.
 */
const ComputeBillingDimensions = ({
  runningHours,
  gbHours,
  overage,
}: {
  runningHours: number
  gbHours: number
  overage: ComputeOverageEstimate | null
}) => (
  <div>
    <DimensionRow label="Runtime in period" value={formatComputeHours(runningHours)} />
    <DimensionRow
      label="GB-hours in period"
      value={formatGbHours(gbHours)}
      isTotal={overage === null}
    />

    {overage !== null && (
      <>
        <DimensionRow
          label="Compute over quota"
          detail={`${formatBillableHours(overage.vcpuHours)} vCPU-hrs × ${formatRate(COMPUTE_OVERAGE_RATES.perVcpuHour)}`}
          value={formatCurrency(overage.vcpuCost) ?? '—'}
        />
        <DimensionRow
          label="Memory over quota"
          detail={`${formatBillableHours(overage.gbHours)} GB-hrs × ${formatRate(COMPUTE_OVERAGE_RATES.perGbHour)}`}
          value={formatCurrency(overage.gbCost) ?? '—'}
        />
        <DimensionRow
          label="Estimated overage"
          value={formatCurrency(overage.total) ?? '—'}
          isTotal
        />
      </>
    )}

    <p className="pt-1 text-xs text-foreground-lighter">
      Usage beyond the included quota is priced per vCPU-hour and GB-hour.{' '}
      {COMPUTE_OVERAGE_RATES.isIllustrative && 'Rates shown are experimental and not final. '}
      <InlineLink href="https://supabase.com/pricing">See pricing</InlineLink>
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
  const overage = estimateComputeOverage(totalReservedVcpuHours, limits.vcpuHours)

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
                <ComputeBillingDimensions
                  runningHours={totalRunningHours}
                  gbHours={totalGbHours}
                  overage={overage}
                />
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

/**
 * Rows are ranked by vCPU-hours, which is the comparison the reader wants; a bar alongside
 * them was read as progress toward a limit rather than a share of the total, so the figures
 * carry it alone.
 */
const ComputeProjectTable = ({ rows }: { rows: ComputeUsageByProject[] }) => {
  return (
    <div className="divide-y border-b">
      <div className="grid grid-cols-12 gap-4 py-2 text-xs font-mono uppercase text-foreground-lighter">
        <span className="col-span-5">Project</span>
        <span className="col-span-5 text-right">vCPU-hrs</span>
        <span className="col-span-2 text-right">CPU used</span>
      </div>
      {rows.map((row) => {
        const cpuUtilization = getCpuUtilization(row.usedVcpuHours, row.reservedVcpuHours)

        return (
          <div key={row.projectRef} className="grid grid-cols-12 items-center gap-4 py-1.5">
            <div className="col-span-5 min-w-0">
              <p className="truncate text-sm text-foreground">{row.projectName}</p>
              <p className="truncate text-xs text-foreground-lighter">
                {pluralize(row.deployments, 'compute')} · {pluralize(row.instances, 'instance')}
              </p>
            </div>
            <p className="col-span-5 text-right text-sm tabular-nums text-foreground-light">
              {formatDecimal(row.reservedVcpuHours)}
            </p>
            <p className="col-span-2 text-right text-sm tabular-nums text-foreground-light">
              {cpuUtilization === null ? '—' : formatPercentage(cpuUtilization)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
