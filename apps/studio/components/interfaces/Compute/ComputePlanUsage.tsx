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

import { COMPUTE_ALLOWANCE_WARNING_THRESHOLD, includedVcpuHours } from './Compute.limits'
import type { ComputeInstance } from './Compute.types'
import {
  formatComputeHours,
  formatPercentage,
  formatVcpuMinutes,
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
  const formatCount = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 0 })

  const cpuUtilization = getCpuUtilization(usage?.usedVcpuHours ?? 0, usage?.reservedVcpuHours ?? 0)

  // The quota is vCPU-minutes, so a larger instance consumes it faster than a smaller one
  // running just as long. Runtime reports alongside as context.
  const quotaHours = includedVcpuHours(limits)

  const meters: MeterDefinition[] = [
    {
      label: 'Compute',
      description: 'vCPU reserved while workers run. Suspended instances accrue nothing.',
      used: usage?.reservedVcpuHours ?? 0,
      included: quotaHours,
      limitKind: 'allowance',
      isLoading: isPending,
      format: formatVcpuMinutes,
      detail:
        cpuUtilization === null
          ? `${formatComputeHours(usage?.runningHours ?? 0)} runtime`
          : `${formatPercentage(cpuUtilization)} CPU used · ${formatComputeHours(usage?.runningHours ?? 0)} runtime`,
    },
    {
      label: 'Concurrent workers',
      description: 'Instances that may run at once across every compute in this project.',
      used: declaredInstances,
      included: limits.concurrentWorkers,
      limitKind: 'capacity',
      isLoading: false,
      format: formatCount,
      detail: `Across ${instances.length.toLocaleString()} ${instances.length === 1 ? 'compute' : 'computes'}`,
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
              <Link href={`/org/${organization.slug}/usage#compute-services`}>View usage</Link>
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
        <div className="grid grid-cols-1 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
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
  included: number | null
  /**
   * An allowance is consumed, so spending all of it is exhaustion. Capacity is occupied, so
   * filling it is valid — only asking for more than it holds is over the limit.
   */
  limitKind: 'allowance' | 'capacity'
  isLoading: boolean
  format: (value: number) => string
  detail?: string
}

const getBarClass = ({ isExceeded, isWarning }: { isExceeded: boolean; isWarning: boolean }) => {
  if (isExceeded) return 'bg-destructive'
  if (isWarning) return 'bg-warning'
  return 'bg-foreground-light'
}

const getMeterStatus = ({ used, included, limitKind }: MeterDefinition) => {
  const hasLimit = included !== null && included > 0

  // Capacity is judged on slots left rather than percentage used: "8 of 10" and "40 of 50"
  // are the same ratio but only one of them is about to block the next deploy.
  if (hasLimit && limitKind === 'capacity') {
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

  const usageRatio = hasLimit && included !== null ? used / included : 0
  const isExceeded = hasLimit && usageRatio >= 1
  const isApproaching = hasLimit && !isExceeded && usageRatio >= COMPUTE_ALLOWANCE_WARNING_THRESHOLD

  return {
    hasLimit,
    isExceeded,
    isAtCapacity: false,
    isApproaching,
    headroom: null,
    barClass: getBarClass({ isExceeded, isWarning: isApproaching }),
  }
}

const formatMeterValue = ({ used, included, format }: MeterDefinition, hasLimit: boolean) =>
  hasLimit && included !== null ? `${format(used)} of ${format(included)}` : `${format(used)} used`

const MeterBar = ({
  meter,
  hasLimit,
  barClass,
}: {
  meter: MeterDefinition
  hasLimit: boolean
  barClass: string
}) => {
  const canFill = hasLimit && !meter.isLoading && meter.included !== null

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
  const caption = [value, headroom ?? meter.detail].filter(Boolean).join(' · ')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-x-2 cursor-default"
          aria-label={`${meter.label}: ${value}`}
        >
          <span className="text-xs text-foreground-light">{meter.label}</span>
          <div className="w-12">
            <MeterBar meter={meter} hasLimit={hasLimit} barClass={barClass} />
          </div>
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

      <MeterBar meter={meter} hasLimit={hasLimit} barClass={barClass} />

      {meter.detail && !isLoading && (
        <p className="text-xs tabular-nums text-foreground-lighter">{meter.detail}</p>
      )}
      {isExceeded && <p className="text-xs text-destructive">{headroom ?? 'Over limit'}</p>}
      {isAtCapacity && <p className="text-xs text-warning">{headroom ?? 'At limit'}</p>}
      {isApproaching && <p className="text-xs text-warning">{headroom ?? 'Approaching limit'}</p>}
      {!isExceeded && !isAtCapacity && !isApproaching && headroom !== null && (
        <p className="text-xs text-foreground-lighter">{headroom}</p>
      )}

      {!hasLimit && !isLoading && <p className="text-xs text-foreground-lighter">{noLimitLabel}</p>}
    </div>
  )
}
