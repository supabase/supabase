import { useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import Link from 'next/link'
import { Button, Card } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { COMPUTE_ALLOWANCE_WARNING_THRESHOLD } from './Compute.limits'
import type { ComputeInstance } from './Compute.types'
import { formatComputeHours } from './ComputeUsage.utils'
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

  return (
    <Card className="divide-y">
      <div className="flex items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h3 className="text-sm text-foreground">Plan usage</h3>
          <p className="text-xs text-foreground-lighter">{`${limitsLabel} · last 30 days`}</p>
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
        <div className="grid grid-cols-1 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <UsageMeter
            label="Active hours"
            description="Hours instances spend serving traffic. Suspended instances do not accrue usage."
            used={usage?.activeHours ?? 0}
            included={limits.activeHours}
            limitKind="allowance"
            isLoading={isPending}
            format={formatComputeHours}
            noLimitLabel={noLimitLabel}
          />

          <UsageMeter
            label="Deployments"
            description="Deployments in this project. Each one runs its own instances."
            used={instances.length}
            included={limits.deployments}
            limitKind="capacity"
            isLoading={false}
            format={(value) => value.toLocaleString()}
            noLimitLabel={noLimitLabel}
          />

          <UsageMeter
            label="Instances"
            description="Instances declared across every compute in this project."
            used={declaredInstances}
            included={limits.instances}
            limitKind="capacity"
            isLoading={false}
            format={(value) => value.toLocaleString()}
            noLimitLabel={noLimitLabel}
          />
        </div>
      )}
    </Card>
  )
}

interface UsageMeterProps {
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
  noLimitLabel: string
}

const UsageMeter = ({
  label,
  description,
  used,
  included,
  limitKind,
  isLoading,
  format,
  noLimitLabel,
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
        <div className="flex items-center gap-x-1.5">
          <p className="text-sm text-foreground">{label}</p>
          <InfoTooltip side="top">{description}</InfoTooltip>
        </div>
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

      {isExceeded && <p className="text-xs text-destructive">Over limit</p>}
      {isAtCapacity && <p className="text-xs text-warning">At limit</p>}
      {isApproaching && <p className="text-xs text-warning">Approaching limit</p>}

      {!hasLimit && !isLoading && <p className="text-xs text-foreground-lighter">{noLimitLabel}</p>}
    </div>
  )
}
