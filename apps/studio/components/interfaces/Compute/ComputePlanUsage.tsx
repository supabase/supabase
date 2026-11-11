import { useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  Card,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { Chart, ChartMetric } from 'ui-patterns/Chart'

import type { ComputeInstance } from './Compute.types'
import {
  formatCapacityQuota,
  formatComputeRequests,
  formatDecimal,
  formatPercentage,
  getComputeCapacity,
  getCpuUtilization,
  type ComputeCapacity,
} from './ComputeUsage.utils'
import { useComputeLimits } from './useComputeLimits'
import { SparkBar } from '@/components/ui/SparkBar'
import { computeProjectUsageQueryOptions } from '@/data/compute/compute-usage-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const USAGE_TIMEFRAMES = [
  { key: '24h', label: 'Last 24 hours', days: 1 },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
] as const

type UsageTimeframe = (typeof USAGE_TIMEFRAMES)[number]

interface UsageMetric {
  label: string
  value: string
  description: string
  /**
   * Per metric, not per card. The instance count comes from props and is known immediately;
   * putting it behind the usage query's skeleton would hide a figure that is already there.
   */
  isLoading: boolean
  /**
   * Set only on a metric bounded by the plan. Everything else here is a total with nothing to
   * measure against, so it gets a figure and no bar — a bar implies a ceiling.
   */
  capacity?: ComputeCapacity
  /**
   * A line under the figure. Carries the headroom where there is a limit, and otherwise says
   * so: on a plan with no cap, or during the alpha where the quota is not metered at all,
   * the absence of a bar is not by itself an answer.
   */
  footnote?: string
}

interface ComputePlanUsageProps {
  projectRef: string
  instances: ComputeInstance[]
}

/**
 * The same five figures each deployment's overview reports, summed across the project, plus
 * the one limit that is scoped to a project.
 *
 * A lone "13 vCPU-hrs" says almost nothing: it is runtime multiplied by instance size, so
 * without the runtime and the size beside it there is no way to tell a long-running small
 * instance from a brief large one, and no way to tell how much of it did work. The family
 * answers that, and reading the same five labels here and on a deployment page means moving
 * between the two is one model at two scopes rather than two.
 */
export const ComputePlanUsage = ({ projectRef, instances }: ComputePlanUsageProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { limits, noLimitLabel } = useComputeLimits(organization?.plan)
  const [timeframe, setTimeframe] = useState<UsageTimeframe>(USAGE_TIMEFRAMES[2])
  const [isCollapsed, setIsCollapsed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.COMPUTE_PLAN_USAGE_COLLAPSED,
    false
  )

  const { data: usage, isPending } = useQuery(
    computeProjectUsageQueryOptions({
      projectRef,
      instances: instances.map((instance) => ({
        name: instance.name,
        size: instance.size,
        declaredInstances: instance.declaredInstances,
      })),
      days: timeframe.days,
    })
  )

  const declaredInstances = instances.reduce(
    (total, instance) => total + instance.declaredInstances,
    0
  )
  const cpuUtilization = getCpuUtilization(usage?.usedVcpuHours ?? 0, usage?.reservedVcpuHours ?? 0)
  const capacity = getComputeCapacity(declaredInstances, limits.concurrentInstances)

  const computeCount = `${instances.length.toLocaleString()} ${instances.length === 1 ? 'compute' : 'computes'}`

  const metrics: UsageMetric[] = [
    {
      label: 'vCPU-hours',
      isLoading: isPending,
      value: formatDecimal(usage?.reservedVcpuHours ?? 0),
      footnote: limits.vcpuHours === null ? noLimitLabel : undefined,
      description:
        limits.vcpuHours === null
          ? `Running hours multiplied by the vCPU each instance size reserves. ${noLimitLabel}.`
          : 'Running hours multiplied by the vCPU each instance size reserves. This is what the organization quota counts, so a larger instance consumes it faster than a smaller one running just as long.',
    },
    {
      label: 'Active CPU',
      isLoading: isPending,
      value: cpuUtilization === null ? '—' : formatPercentage(cpuUtilization),
      description:
        'Share of reserved vCPU that did work. The rest was reserved and idle, e.g. waiting on I/O.',
    },
    {
      label: 'Running hours',
      isLoading: isPending,
      value: formatDecimal(usage?.runningHours ?? 0),
      description: `Hours instances were running, busy or idle, rather than suspended. Across ${computeCount}.`,
    },
    {
      label: 'GB-hours',
      isLoading: isPending,
      value: formatDecimal(usage?.gbHours ?? 0),
      description:
        'Memory reserved over time. Pinned at 2 GB per vCPU on every size, so it tracks vCPU-hours exactly — it is here because overage prices it as its own dimension, not because it can move on its own.',
    },
    {
      label: 'Requests',
      isLoading: isPending,
      value: formatComputeRequests(usage?.requests ?? 0),
      description: 'Requests handled across every instance in this project.',
    },
    {
      label: 'Concurrent instances',
      isLoading: false,
      value: formatCapacityQuota(declaredInstances, limits.concurrentInstances),
      description: `Instances that may run at once across every compute in this project. ${computeCount} deployed.`,
      capacity,
      footnote: capacity.status === 'unlimited' ? noLimitLabel : (capacity.label ?? undefined),
    },
  ]

  return (
    <Card className="divide-y">
      <div className="flex items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h3 className="text-sm text-foreground">Usage</h3>
          {isCollapsed && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {metrics.map((metric) => (
                <CompactMetric key={metric.label} metric={metric} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-x-2">
          <UsageTimeframeDropdown value={timeframe} onChange={setTimeframe} />
          {organization?.slug && (
            <Button asChild>
              <Link href={`/org/${organization.slug}/usage#compute-services`}>
                Organization usage
              </Link>
            </Button>
          )}
          <Button
            variant="text"
            className="px-1.5"
            aria-label={isCollapsed ? 'Expand plan usage' : 'Collapse plan usage'}
            aria-expanded={!isCollapsed}
            icon={isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {metrics.map((metric) => (
            <UsageMetricCell key={metric.label} metric={metric} />
          ))}
        </div>
      )}
    </Card>
  )
}

const UsageTimeframeDropdown = ({
  value,
  onChange,
}: {
  value: UsageTimeframe
  onChange: (timeframe: UsageTimeframe) => void
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button iconRight={<ChevronDownIcon size={14} />}>{value.label}</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="bottom" align="end" className="w-40">
      <DropdownMenuRadioGroup
        value={value.key}
        onValueChange={(key) => {
          const next = USAGE_TIMEFRAMES.find((timeframe) => timeframe.key === key)
          if (next) onChange(next)
        }}
      >
        {USAGE_TIMEFRAMES.map((timeframe) => (
          <DropdownMenuRadioItem key={timeframe.key} value={timeframe.key}>
            {timeframe.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)

const CAPACITY_BAR_CLASS: Record<ComputeCapacity['status'], string> = {
  exceeded: 'bg-destructive',
  full: 'bg-warning',
  low: 'bg-warning',
  available: 'bg-foreground-light',
  unlimited: 'bg-foreground-light',
}

const CAPACITY_TEXT_CLASS: Record<ComputeCapacity['status'], string> = {
  exceeded: 'text-destructive',
  full: 'text-warning',
  low: 'text-warning',
  available: 'text-foreground-lighter',
  unlimited: 'text-foreground-lighter',
}

const UsageMetricCell = ({ metric }: { metric: UsageMetric }) => {
  const { capacity } = metric
  const hasLimit = capacity !== undefined && capacity.limit !== null && capacity.limit > 0

  return (
    <Chart isLoading={metric.isLoading} className="flex flex-col gap-2 px-5 py-4">
      <ChartMetric label={metric.label} value={metric.value} tooltip={metric.description} />

      {hasLimit && (
        <SparkBar
          type="horizontal"
          barClass={CAPACITY_BAR_CLASS[capacity.status]}
          bgClass="bg-surface-400"
          value={capacity.used}
          max={capacity.limit ?? 1}
        />
      )}

      {metric.footnote && (
        <p
          className={cn(
            'text-xs',
            capacity ? CAPACITY_TEXT_CLASS[capacity.status] : 'text-foreground-lighter'
          )}
        >
          {metric.footnote}
        </p>
      )}
    </Chart>
  )
}

const CompactMetric = ({ metric }: { metric: UsageMetric }) => (
  <div className="flex items-baseline gap-x-1.5" aria-label={`${metric.label}: ${metric.value}`}>
    <span className="text-xs text-foreground-light">{metric.label}</span>
    <span className="text-xs tabular-nums text-foreground">
      {metric.isLoading ? '—' : metric.value}
    </span>
  </div>
)
