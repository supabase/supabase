import { useQuery } from '@tanstack/react-query'
import { Card } from 'ui'

import type { ComputeInstance } from './Compute.types'
import {
  COMPUTE_ALLOWANCE_WARNING_THRESHOLD,
  getComputeActiveHoursAllowance,
  getComputeDeploymentAllowance,
  getComputeInstanceAllowance,
} from './ComputeUsage.constants'
import { formatComputeHours } from './ComputeUsage.utils'
import { SparkBar } from '@/components/ui/SparkBar'
import { computeProjectUsageQueryOptions } from '@/data/compute/compute-usage-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const USAGE_WINDOW_DAYS = 30

interface ComputePlanUsageProps {
  projectRef: string
  instances: ComputeInstance[]
}

/**
 * Compares what the plan includes against what the project is using. Counts the two entities
 * separately: computes are the deployments, instances are what each one runs. Figures are
 * estimates while Compute is in alpha — nothing here is billed yet.
 */
export const ComputePlanUsage = ({ projectRef, instances }: ComputePlanUsageProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const planId = organization?.plan?.id
  const planName = organization?.plan?.name

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

  const activeHoursAllowance = getComputeActiveHoursAllowance(planId)
  const deploymentAllowance = getComputeDeploymentAllowance(planId)
  const instanceAllowance = getComputeInstanceAllowance(planId)
  const declaredInstances = instances.reduce(
    (total, instance) => total + instance.declaredInstances,
    0
  )

  return (
    <Card className="divide-y">
      <div className="flex items-baseline justify-between gap-2 px-5 py-3">
        <h3 className="text-sm text-foreground">Plan usage</h3>
        <p className="text-xs text-foreground-lighter">
          {planName === undefined ? 'Last 30 days' : `${planName} Plan · last 30 days`}
        </p>
      </div>

      <UsageMeter
        label="Active hours"
        description="Hours instances spend serving traffic. Suspended instances do not accrue usage."
        used={usage?.activeHours ?? 0}
        included={activeHoursAllowance}
        limitKind="allowance"
        isLoading={isPending}
        format={formatComputeHours}
        planName={planName}
      />

      <UsageMeter
        label="Computes"
        description="Deployments in this project. Each one runs its own instances."
        used={instances.length}
        included={deploymentAllowance}
        limitKind="capacity"
        isLoading={false}
        format={(value) => value.toLocaleString()}
        planName={planName}
      />

      <UsageMeter
        label="Instances"
        description="Instances declared across every compute in this project."
        used={declaredInstances}
        included={instanceAllowance}
        limitKind="capacity"
        isLoading={false}
        format={(value) => value.toLocaleString()}
        planName={planName}
      />
    </Card>
  )
}

interface UsageMeterProps {
  label: string
  description: string
  used: number
  /** `null` when the plan carries no fixed limit. */
  included: number | null
  /**
   * An allowance is consumed, so spending all of it is exhaustion. Capacity is occupied, so
   * filling it is valid — only asking for more than it holds is over the limit.
   */
  limitKind: 'allowance' | 'capacity'
  isLoading: boolean
  format: (value: number) => string
  planName: string | undefined
}

const UsageMeter = ({
  label,
  description,
  used,
  included,
  limitKind,
  isLoading,
  format,
  planName,
}: UsageMeterProps) => {
  const hasLimit = included !== null && included > 0
  const usageRatio = hasLimit ? used / included : 0
  const isExceeded = hasLimit && (limitKind === 'allowance' ? usageRatio >= 1 : used > included)
  const isAtCapacity = hasLimit && limitKind === 'capacity' && used === included
  const isApproaching =
    hasLimit && !isExceeded && !isAtCapacity && usageRatio >= COMPUTE_ALLOWANCE_WARNING_THRESHOLD

  // Neutral by default; colour only once the number means something.
  const barClass = isExceeded
    ? 'bg-destructive'
    : isApproaching || isAtCapacity
      ? 'bg-warning'
      : 'bg-foreground-light'

  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-sm tabular-nums text-foreground-light">
          {isLoading && '—'}
          {!isLoading && !hasLimit && `${format(used)} used`}
          {!isLoading && hasLimit && `${format(used)} of ${format(included)}`}
        </p>
      </div>

      {hasLimit && !isLoading && (
        <SparkBar
          type="horizontal"
          barClass={barClass}
          bgClass="bg-surface-300"
          value={used}
          max={included}
        />
      )}

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-foreground-lighter">{description}</p>
        {isExceeded && <p className="shrink-0 text-xs text-destructive">Over limit</p>}
        {isAtCapacity && <p className="shrink-0 text-xs text-warning">At limit</p>}
        {isApproaching && <p className="shrink-0 text-xs text-warning">Approaching limit</p>}
      </div>

      {!hasLimit && !isLoading && (
        <p className="text-xs text-foreground-lighter">
          No fixed limit on the {planName ?? 'current'} Plan
        </p>
      )}
    </div>
  )
}
