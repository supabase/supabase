import { useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { COMPUTE_ALLOWANCE_WARNING_THRESHOLD } from './Compute.limits'
import type { ComputeInstance } from './Compute.types'
import {
  formatGbHours,
  formatPercentage,
  formatVcpuHours,
  getCpuUtilization,
} from './ComputeUsage.utils'
import { useComputeLimits } from './useComputeLimits'
import { SparkBar } from '@/components/ui/SparkBar'
import { computeProjectUsageQueryOptions } from '@/data/compute/compute-usage-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const USAGE_WINDOW_DAYS = 30

interface ComputePlanUsageProps {
  projectRef: string
  instances: ComputeInstance[]
}

export const ComputePlanUsage = ({ projectRef, instances }: ComputePlanUsageProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { limits, limitsLabel, noLimitLabel } = useComputeLimits(organization?.plan)
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
      days: USAGE_WINDOW_DAYS,
    })
  )

  const declaredInstances = instances.reduce(
    (total, instance) => total + instance.declaredInstances,
    0
  )
  const formatCount = (value: number) => value.toLocaleString()

  const cpuUtilization = getCpuUtilization(usage?.usedVcpuHours ?? 0, usage?.reservedVcpuHours ?? 0)

  const meters: MeterDefinition[] = [
    {
      label: 'vCPU-hours',
      description: 'vCPU reserved while instances run. Suspended instances reserve nothing.',
      used: usage?.reservedVcpuHours ?? 0,
      included: limits.vcpuHours,
      limitKind: 'allowance',
      isLoading: isPending,
      format: formatVcpuHours,
      detail: cpuUtilization === null ? undefined : `${formatPercentage(cpuUtilization)} CPU used`,
    },
    {
      label: 'GB-hours',
      description: 'Memory reserved while instances run. Suspended instances reserve nothing.',
      used: usage?.gbHours ?? 0,
      included: limits.gbHours,
      limitKind: 'allowance',
      isLoading: isPending,
      format: formatGbHours,
    },
    {
      label: 'Deployments',
      description: 'Deployments in this project. Each one runs its own instances.',
      used: instances.length,
      included: limits.deployments,
      limitKind: 'capacity',
      isLoading: false,
      format: formatCount,
    },
    {
      label: 'Instances',
      description: 'Instances declared across every compute in this project.',
      used: declaredInstances,
      included: limits.instances,
      limitKind: 'capacity',
      isLoading: false,
      format: formatCount,
    },
  ]

  return (
    <Card className="divide-y">
      <div className="flex items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h3 className="text-sm text-foreground">Plan usage</h3>
          {isCollapsed ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {meters.map((meter) => (
                <CompactUsageMeter key={meter.label} {...meter} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-foreground-lighter">{`${limitsLabel} · last 30 days`}</p>
          )}
        </div>
        <div className="flex items-center gap-x-2">
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
        <div className="grid grid-cols-1 divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {meters.map((meter) => (
            <UsageMeter key={meter.label} {...meter} noLimitLabel={noLimitLabel} />
          ))}
        </div>
      )}
    </Card>
  )
}

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

const getMeterStatus = ({ used, included, limitKind }: MeterDefinition) => {
  const hasLimit = included !== null && included > 0
  const usageRatio = hasLimit ? used / included : 0
  const isExceeded = hasLimit && (limitKind === 'allowance' ? usageRatio >= 1 : used > included)
  const isAtCapacity = hasLimit && limitKind === 'capacity' && used === included
  const isApproaching =
    hasLimit && !isExceeded && !isAtCapacity && usageRatio >= COMPUTE_ALLOWANCE_WARNING_THRESHOLD

  const barClass = isExceeded
    ? 'bg-destructive'
    : isApproaching || isAtCapacity
      ? 'bg-warning'
      : 'bg-foreground-light'

  return { hasLimit, isExceeded, isAtCapacity, isApproaching, barClass }
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
  const { hasLimit, barClass } = getMeterStatus(meter)
  const value = meter.isLoading ? undefined : formatMeterValue(meter, hasLimit)

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
        {value && (
          <p className="mt-1 tabular-nums text-foreground-light">
            {meter.detail ? `${value} · ${meter.detail}` : value}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

const UsageMeter = ({ noLimitLabel, ...meter }: MeterDefinition & { noLimitLabel: string }) => {
  const { label, description, isLoading } = meter
  const { hasLimit, isExceeded, isAtCapacity, isApproaching, barClass } = getMeterStatus(meter)

  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
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
      {isExceeded && <p className="text-xs text-destructive">Over limit</p>}
      {isAtCapacity && <p className="text-xs text-warning">At limit</p>}
      {isApproaching && <p className="text-xs text-warning">Approaching limit</p>}

      {!hasLimit && !isLoading && <p className="text-xs text-foreground-lighter">{noLimitLabel}</p>}
    </div>
  )
}
