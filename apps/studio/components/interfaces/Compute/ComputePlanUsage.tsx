import { useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import type { ComputeInstance } from './Compute.types'
import {
  formatCapacityQuota,
  formatComputeHours,
  formatPercentage,
  formatVcpuQuota,
  getComputeCapacity,
  getCpuUtilization,
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

interface ComputePlanUsageProps {
  projectRef: string
  instances: ComputeInstance[]
}

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
  const runtime = formatComputeHours(usage?.runningHours ?? 0)

  // Only the headline figure and its status earn a place on the card. Runtime, CPU utilisation
  // and the compute count are context for someone already reading the number, so they sit in
  // the tooltip rather than stacking three lines under every bar.
  const meters: MeterDefinition[] = [
    {
      label: 'Compute',
      description: [
        'vCPU reserved while instances run in this project. Suspended instances accrue nothing.',
        cpuUtilization === null
          ? `${runtime} runtime this period.`
          : `${runtime} runtime this period, ${formatPercentage(cpuUtilization)} of it spent on CPU.`,
      ].join(' '),
      used: usage?.reservedVcpuHours ?? 0,
      // The quota belongs to the organization, so a project cannot be "over" it and a bar
      // measuring one project against all of it would be a lie. This reports what this project
      // consumed; the org usage page owns the burn-down.
      included: null,
      isLoading: isPending,
      formatValue: formatVcpuQuota,
      caption: limits.vcpuHours === null ? noLimitLabel : 'Counted against the organization quota',
    },
    {
      label: 'Concurrent instances',
      description: `Instances that may run at once across every compute in this project. ${instances.length.toLocaleString()} ${instances.length === 1 ? 'compute' : 'computes'} deployed.`,
      used: declaredInstances,
      included: limits.concurrentInstances,
      isLoading: false,
      formatValue: formatCapacityQuota,
    },
  ]

  return (
    <Card className="divide-y">
      <div className="flex items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h3 className="text-sm text-foreground">Usage</h3>
          {isCollapsed && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {meters.map((meter) => (
                <CompactUsageMeter key={meter.label} {...meter} />
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
        <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {meters.map((meter) => (
            <UsageMeter key={meter.label} {...meter} noLimitLabel={noLimitLabel} />
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

interface MeterDefinition {
  label: string
  description: string
  used: number
  /**
   * `null` reports the figure on its own, with no bar. Both meters here are project-scoped,
   * but only concurrency has a limit at that scope — the quota belongs to the organization.
   */
  included: number | null
  isLoading: boolean
  /** Formats both sides as one string, so the pair cannot end up in two different units. */
  formatValue: (used: number, included: number | null) => string
  /** Shown in place of a status line when there is no limit to be measured against. */
  caption?: string
}

const getBarClass = ({ isExceeded, isWarning }: { isExceeded: boolean; isWarning: boolean }) => {
  if (isExceeded) return 'bg-destructive'
  if (isWarning) return 'bg-warning'
  return 'bg-foreground-light'
}

/**
 * Every limit on this card is capacity, so it is judged on slots left rather than percentage
 * used: "8 of 10" and "40 of 50" are the same ratio but only one is about to block a deploy.
 */
const getMeterStatus = ({ used, included }: MeterDefinition) => {
  const hasLimit = included !== null && included > 0
  if (!hasLimit) {
    return {
      hasLimit,
      isExceeded: false,
      isAtCapacity: false,
      isApproaching: false,
      headroom: null,
      barClass: getBarClass({ isExceeded: false, isWarning: false }),
    }
  }

  const { status, label } = getComputeCapacity(used, included)
  const isExceeded = status === 'exceeded'
  const isAtCapacity = status === 'full'
  const isApproaching = status === 'low'

  return {
    hasLimit,
    isExceeded,
    isAtCapacity,
    isApproaching,
    headroom: label,
    barClass: getBarClass({ isExceeded, isWarning: isApproaching || isAtCapacity }),
  }
}

const formatMeterValue = ({ used, included, formatValue }: MeterDefinition, hasLimit: boolean) =>
  formatValue(used, hasLimit ? included : null)

/** Only rendered for a meter that has a limit, so `included` is non-null by construction. */
const MeterBar = ({ meter, barClass }: { meter: MeterDefinition; barClass: string }) => {
  const canFill = !meter.isLoading && meter.included !== null

  return (
    <SparkBar
      type="horizontal"
      barClass={barClass}
      bgClass="bg-surface-400"
      value={canFill ? meter.used : 0}
      max={canFill && meter.included !== null ? meter.included : 1}
    />
  )
}

const CompactUsageMeter = (meter: MeterDefinition) => {
  const { hasLimit, headroom, barClass } = getMeterStatus(meter)
  const value = meter.isLoading ? undefined : formatMeterValue(meter, hasLimit)
  const caption = [value, headroom].filter(Boolean).join(' · ')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-x-2 cursor-default"
          aria-label={`${meter.label}: ${value}`}
        >
          <span className="text-xs text-foreground-light">{meter.label}</span>
          <div className="w-12">{hasLimit && <MeterBar meter={meter} barClass={barClass} />}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        <p>{meter.description}</p>
        {value && <p className="mt-1 tabular-nums text-foreground-light">{caption}</p>}
      </TooltipContent>
    </Tooltip>
  )
}

const UsageMeter = ({ noLimitLabel, ...meter }: MeterDefinition & { noLimitLabel: string }) => {
  const { label, description, isLoading } = meter
  const { hasLimit, isExceeded, isAtCapacity, isApproaching, headroom, barClass } =
    getMeterStatus(meter)

  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <div className="flex items-center gap-x-1.5">
          <p className="text-sm text-foreground">{label}</p>
          <InfoTooltip side="top">{description}</InfoTooltip>
        </div>
        <p className="text-sm tabular-nums text-foreground-light">
          {isLoading && '—'}
          {!isLoading && formatMeterValue(meter, hasLimit)}
        </p>
      </div>

      {hasLimit && <MeterBar meter={meter} barClass={barClass} />}

      {!hasLimit && !isLoading && (
        <p className="text-xs text-foreground-lighter">{meter.caption ?? noLimitLabel}</p>
      )}
      {isExceeded && <p className="text-xs text-destructive">{headroom ?? 'Over limit'}</p>}
      {isAtCapacity && <p className="text-xs text-warning">{headroom ?? 'At limit'}</p>}
      {isApproaching && <p className="text-xs text-warning">{headroom ?? 'Approaching limit'}</p>}
      {!isExceeded && !isAtCapacity && !isApproaching && headroom !== null && (
        <p className="text-xs text-foreground-lighter">{headroom}</p>
      )}
    </div>
  )
}
