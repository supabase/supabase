import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { billingMetricUnit, formatUsage } from '../helpers'
import { Metric, USAGE_APPROACHING_THRESHOLD } from './BillingBreakdown.constants'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import type { OrgSubscription } from '@/data/subscriptions/types'
import type { OrgUsageResponse } from '@/data/usage/org-usage-query'
import { formatCurrency } from '@/lib/helpers'

export interface BillingMetricProps {
  idx: number
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
  subscription: OrgSubscription
  relativeToSubscription: boolean
}

export const BillingMetric = ({
  slug,
  metric,
  usage,
  subscription,
  relativeToSubscription,
}: BillingMetricProps) => {
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)

  const usageLabel = useMemo(() => {
    if (!usageMeta) return ''

    if (relativeToSubscription && usageMeta.available_in_plan === false) {
      return 'Unavailable in plan'
    } else if (
      (usageMeta.cost && usageMeta.cost > 0) ||
      !relativeToSubscription ||
      usageMeta.unlimited ||
      usageMeta.pricing_free_units === 0
    ) {
      return metric.units === 'bytes' || metric.units === 'gigabytes'
        ? `${usageMeta.usage.toLocaleString() ?? 0} GB`
        : usageMeta.usage.toLocaleString() + (metric.unitName ? ` ${metric.unitName}` : '')
    } else {
      return metric.units === 'bytes' || metric.units === 'gigabytes'
        ? `${usageMeta.usage.toLocaleString() ?? 0} / ${usageMeta.pricing_free_units?.toLocaleString() ?? 0} GB`
        : `${usageMeta.usage.toLocaleString()} / ${usageMeta.pricing_free_units?.toLocaleString()}` +
            (metric.unitName ? ` ${metric.unitName}` : '')
    }
  }, [usageMeta, relativeToSubscription, metric])

  const isLogMetricOnNonPlatformPlan =
    (metric.key === PricingMetric.LOG_INGESTION || metric.key === PricingMetric.LOG_QUERYING) &&
    subscription?.plan.id !== 'platform'

  const sortedProjectAllocations = useMemo(() => {
    if (!usageMeta || !usageMeta.project_allocations) return []

    return usageMeta.project_allocations.sort((a, b) => b.usage - a.usage)
  }, [usageMeta])

  if (!usageMeta) return null

  const usageRatio =
    usageMeta.usage === 0 ? 0 : usageMeta.usage / (usageMeta.pricing_free_units ?? 0)

  const isUsageBillingEnabled = subscription?.usage_billing_enabled === true

  const hasLimit = !!usageMeta.unlimited === false
  const isApproachingLimit = hasLimit && usageRatio >= USAGE_APPROACHING_THRESHOLD
  const isExceededLimit = relativeToSubscription && hasLimit && usageRatio >= 1

  const unit = billingMetricUnit(usageMeta.metric as PricingMetric)

  const percentageLabel =
    usageMeta.usage === 0 || usageMeta.pricing_free_units === 0
      ? ''
      : usageRatio < 0.01
        ? '(<1%)'
        : `(${(+(usageRatio * 100).toFixed(0)).toLocaleString()}%)`

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center justify-between')}>
          {metric.anchor ? (
            <Link href={`/org/${slug}/usage#${metric.anchor}`} className="block w-full group">
              <div className="group flex items-center gap-1">
                <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer items-center">
                  <span>{metric.name}</span>
                  {isLogMetricOnNonPlatformPlan && (
                    <Badge className="ml-2" variant={'warning'}>
                      Upcoming
                    </Badge>
                  )}
                </p>
                {usageMeta.available_in_plan && (
                  <span className="text-foreground-muted transition inline-block group-hover:transform group-hover:translate-x-0.5">
                    <ChevronRight strokeWidth={1.5} size={16} className="transition" />
                  </span>
                )}
              </div>
              <span className="text-sm">{usageLabel}</span>&nbsp;
              {relativeToSubscription && usageMeta.cost && usageMeta.cost > 0 ? (
                <span
                  className={cn('text-sm', isLogMetricOnNonPlatformPlan && 'line-through')}
                  translate="no"
                >
                  ({formatCurrency(usageMeta.cost)})
                </span>
              ) : usageMeta.available_in_plan &&
                usageMeta.pricing_free_units !== 0 &&
                !usageMeta.unlimited &&
                relativeToSubscription ? (
                <span className="text-sm">{percentageLabel}</span>
              ) : null}
            </Link>
          ) : (
            <div className="block w-full">
              <p className="text-sm text-foreground-light flex space-x-1">{metric.name}</p>
              <span className="text-sm">{usageLabel}</span>&nbsp;
              {relativeToSubscription && usageMeta.cost && usageMeta.cost > 0 ? (
                <span className="text-sm" translate="no">
                  ({formatCurrency(usageMeta.cost)})
                </span>
              ) : usageMeta.available_in_plan &&
                usageMeta.pricing_free_units !== 0 &&
                !usageMeta.unlimited &&
                relativeToSubscription ? (
                <span className="text-sm">{percentageLabel}</span>
              ) : null}
            </div>
          )}

          {usageMeta.available_in_plan ? (
            <div>
              {relativeToSubscription &&
              !usageMeta.unlimited &&
              usageMeta.pricing_free_units !== 0 ? (
                <svg className="h-8 w-8 -rotate-90 transform">
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
                      isUsageBillingEnabled
                        ? 'text-gray-dark-800'
                        : isExceededLimit
                          ? 'text-red-900'
                          : isApproachingLimit
                            ? 'text-yellow-1000'
                            : 'text-gray-dark-800'
                    }
                  />
                </svg>
              ) : null}
            </div>
          ) : (
            <div>
              <UpgradePlanButton
                source={`billingBreakdownUsage${metric.anchor}`}
                featureProposition={`to use ${metric.name}`}
              >
                Upgrade
              </UpgradePlanButton>
            </div>
          )}
        </div>
      </TooltipTrigger>
      {usageMeta.available_in_plan && (
        <TooltipContent side="bottom" align="start" className="max-w-[400px]" alignOffset={-15}>
          <div className="text-xs flex flex-col gap-y-2">
            <p className="font-medium" translate="no">
              {usageMeta.unit_price_desc}
            </p>

            {metric.tip && (
              <p className="text-foreground-light">
                {metric.tip}{' '}
                {metric.docLink && (
                  <Link
                    href={metric.docLink.url}
                    target="_blank"
                    className="transition text-primary hover:text-primary-hover underline"
                  >
                    {metric.docLink.title}
                  </Link>
                )}
              </p>
            )}

            {subscription.usage_billing_enabled && isLogMetricOnNonPlatformPlan && (
              <p className="text-foreground-light">
                Billing and enforcement of restrictions for this metric will only start after the
                grace period ends at the start of 2027.
              </p>
            )}

            {subscription.usage_billing_enabled === false &&
              relativeToSubscription &&
              (isApproachingLimit || isExceededLimit) &&
              (isLogMetricOnNonPlatformPlan ? (
                <p className="text-foreground-light">
                  Enforcement of restrictions will only start after the grace period ends at the
                  start of 2027. Reduce your usage, upgrade to a usage-based plan or disable the
                  spend cap to avoid restrictions.
                </p>
              ) : (
                <p className="text-foreground-light">
                  Exceeding your plans included usage will lead to restrictions to your project.
                  Upgrade to a usage-based plan or disable the spend cap to avoid restrictions.
                </p>
              ))}

            {sortedProjectAllocations && sortedProjectAllocations.length > 0 && (
              <table className="list-disc w-full">
                <thead>
                  <tr>
                    <th className="text-left">Project</th>
                    <th className="text-right">Usage</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:pb-1">
                  {sortedProjectAllocations.map((allocation) => (
                    <tr key={`${usageMeta.metric}_${allocation.ref}`}>
                      <td className="text-foreground-light">{allocation.name}</td>
                      <td className="text-foreground-light text-right">
                        {formatUsage(usageMeta.metric as PricingMetric, allocation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-1 border-t text-left">
                      Total{unit && <span> ({unit})</span>}
                    </td>
                    <td className="py-1 border-t text-right">
                      {formatUsage(usageMeta.metric as PricingMetric, {
                        usage: usageMeta.usage_original,
                      })}{' '}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
