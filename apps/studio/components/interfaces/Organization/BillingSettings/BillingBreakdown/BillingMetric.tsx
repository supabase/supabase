import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'

import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import type { OrgUsageResponse } from 'data/usage/org-usage-query'
import { formatCurrency } from 'lib/helpers'
import { useMemo } from 'react'
import { Button } from 'ui'
import { billingMetricUnit, formatUsage } from '../helpers'
import { Metric, USAGE_APPROACHING_THRESHOLD } from './BillingBreakdown.constants'
import { ChevronRight, PieChart } from 'lucide-react'

export interface BillingMetricProps {
  idx: number
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
  subscription: OrgSubscription
  relativeToSubscription: boolean
}

const BillingMetric = ({
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
        ? `${usageMeta.usage.toLocaleString() ?? 0} / ${usageMeta.pricing_free_units ?? 0} GB`
        : `${usageMeta.usage.toLocaleString()} / ${usageMeta.pricing_free_units?.toLocaleString()}` +
            (metric.unitName ? ` ${metric.unitName}` : '')
    }
  }, [usageMeta, relativeToSubscription, metric])

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
    <div className="flex items-center justify-between">
      <div>
        {metric.anchor ? (
          <Link href={`/org/${slug}/usage#${metric.anchor}`}>
            <div className="group flex items-center space-x-2">
              <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
                {metric.name}
              </p>
              <ChevronRight strokeWidth={1.5} size={16} className="transition" />
            </div>
          </Link>
        ) : (
          <p className="text-sm text-foreground-light">{metric.name}</p>
        )}
        <span className="text-sm">{usageLabel}</span>&nbsp;
        {relativeToSubscription && usageMeta.cost && usageMeta.cost > 0 ? (
          <span className="text-sm">({formatCurrency(usageMeta.cost)})</span>
        ) : usageMeta.available_in_plan && !usageMeta.unlimited && relativeToSubscription ? (
          <span className="text-sm">{percentageLabel}</span>
        ) : null}
      </div>

      {usageMeta.available_in_plan ? (
        <div>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              {relativeToSubscription && !usageMeta.unlimited ? (
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
              ) : (
                <PieChart className="h-8 w-8 p-1" />
              )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div className="rounded bg-alternative py-1 px-2 leading-none shadow border border-background min-w-[300px] max-w-[450px] max-h-[300px] overflow-y-auto">
                  <div className="text-xs text-foreground space-y-2">
                    <p className="font-medium">{usageMeta.unit_price_desc}</p>

                    {metric.tip && (
                      <div className="my-2">
                        <p className="text-xs">{metric.tip}</p>
                      </div>
                    )}

                    {subscription.usage_billing_enabled === false &&
                      relativeToSubscription &&
                      (isApproachingLimit || isExceededLimit) && (
                        <div className="mt-2">
                          <p className="text-xs">
                            Exceeding your plans included usage will lead to restrictions to your
                            project. Upgrade to a usage-based plan or disable the spend cap to avoid
                            restrictions.
                          </p>
                        </div>
                      )}

                    {sortedProjectAllocations && sortedProjectAllocations.length > 0 && (
                      <table className="list-disc w-full">
                        <thead>
                          <tr>
                            <th className="text-left">Project</th>
                            <th className="text-right">Usage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedProjectAllocations.map((allocation) => (
                            <tr key={`${usageMeta.metric}_${allocation.ref}`}>
                              <td>{allocation.name}</td>
                              <td className="text-right">
                                {formatUsage(usageMeta.metric as PricingMetric, allocation)}
                              </td>
                            </tr>
                          ))}
                          <tr></tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td className="py-2 border-t text-left">
                              Total{unit && <span> ({unit})</span>}
                            </td>
                            <td className="py-2 border-t text-right">
                              {formatUsage(usageMeta.metric as PricingMetric, {
                                usage: usageMeta.usage_original,
                              })}{' '}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      ) : (
        <div>
          <Button type="default" asChild>
            <Link href={`/org/${slug}/billing?panel=subscriptionPlan`}>Upgrade</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default BillingMetric
