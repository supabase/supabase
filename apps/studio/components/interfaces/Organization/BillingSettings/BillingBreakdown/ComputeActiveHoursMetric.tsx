import { useQuery } from '@tanstack/react-query'
import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { USAGE_APPROACHING_THRESHOLD } from './BillingBreakdown.constants'
import { sumBy } from '@/components/interfaces/Compute/ComputeUsage.utils'
import { useComputeLimits } from '@/components/interfaces/Compute/useComputeLimits'
import { computeOrgUsageQueryOptions } from '@/data/compute/compute-usage-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

const USAGE_WINDOW_DAYS = 30

export interface ComputeActiveHoursMetricProps {
  slug: string
  projectRef?: string | null
  subscription: OrgSubscription | undefined
  relativeToSubscription: boolean
  className?: string
}

/**
 * Compute's headline figure in the Usage Summary.
 *
 * Active hours rather than requests: a compute accrues usage for as long as its instances
 * stay alive, whether or not anything calls them, so request counts under-report an
 * always-on service. Active hours is also what the plan allowance is denominated in, which
 * is what lets this render a used/included ratio like every other metric here.
 */
export const ComputeActiveHoursMetric = ({
  slug,
  projectRef,
  subscription,
  relativeToSubscription,
  className,
}: ComputeActiveHoursMetricProps) => {
  const { data, isPending } = useQuery(
    computeOrgUsageQueryOptions({ orgSlug: slug, projectRef, days: USAGE_WINDOW_DAYS })
  )

  const { limits } = useComputeLimits(subscription?.plan)
  const allowanceHours = limits.activeHours
  const deploymentAllowance = limits.deployments

  if (isPending) {
    return (
      <div className={className}>
        <ShimmeringLoader className="w-40" />
      </div>
    )
  }

  const activeHours = sumBy(data?.points ?? [], (point) => point.activeHours)
  const deployments = data?.deployments ?? 0

  const hasLimit = allowanceHours !== null && allowanceHours > 0
  const usageRatio = hasLimit ? activeHours / allowanceHours : 0
  const isApproachingLimit = hasLimit && usageRatio >= USAGE_APPROACHING_THRESHOLD
  const isExceededLimit = relativeToSubscription && hasLimit && usageRatio >= 1

  const usageLabel =
    hasLimit && relativeToSubscription
      ? `${Math.round(activeHours).toLocaleString()} / ${allowanceHours.toLocaleString()} hours`
      : `${Math.round(activeHours).toLocaleString()} hours`

  const percentageLabel =
    !hasLimit || activeHours === 0
      ? ''
      : usageRatio < 0.01
        ? '(<1%)'
        : `(${(+(usageRatio * 100).toFixed(0)).toLocaleString()}%)`

  const computesLabel =
    deploymentAllowance === null
      ? `${deployments.toLocaleString()} computes`
      : `${deployments.toLocaleString()} of ${deploymentAllowance.toLocaleString()} computes`

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Link href={`/org/${slug}/usage#compute-services`} className="block w-full group">
        <div className="group flex items-center gap-1">
          <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
            Compute Active Hours
          </p>
          <span className="text-foreground-muted transition inline-block group-hover:transform group-hover:translate-x-0.5">
            <ChevronRightIcon strokeWidth={1.5} size={16} className="transition" />
          </span>
        </div>
        <span className="text-sm">{usageLabel}</span>&nbsp;
        {relativeToSubscription && percentageLabel !== '' && (
          <span className="text-sm">{percentageLabel}</span>
        )}
        <p className="text-sm text-foreground-lighter">{computesLabel}</p>
      </Link>

      {relativeToSubscription && hasLimit && (
        <svg className="h-8 w-8 -rotate-90 transform" aria-hidden>
          <circle
            cx={15}
            cy={15}
            r={12}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={4}
            className="text-background-surface-300"
          />
          <circle
            cx={15}
            cy={15}
            r={12}
            fill="transparent"
            stroke="currentColor"
            strokeDasharray={75.398}
            strokeDashoffset={`calc(75.39822 - ${
              usageRatio < 1 ? usageRatio * 100 : 100
            } / 100 * 75.39822)`}
            strokeWidth={4}
            className={
              isExceededLimit
                ? 'text-destructive'
                : isApproachingLimit
                  ? 'text-warning'
                  : 'text-foreground-muted'
            }
          />
        </svg>
      )}
    </div>
  )
}
