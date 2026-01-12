import Link from 'next/link'

import { ComputeUsageMetric, PricingMetric } from 'data/analytics/org-daily-stats-query'
import type { OrgUsageResponse } from 'data/usage/org-usage-query'
import { DOCS_URL } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { formatUsage } from '../helpers'
import { Metric } from './BillingBreakdown.constants'

export interface ComputeMetricProps {
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
  relativeToSubscription: boolean
  className?: string
}

export const ComputeMetric = ({
  slug,
  metric,
  usage,
  relativeToSubscription,
  className,
}: ComputeMetricProps) => {
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)

  const usageLabel = useMemo(() => {
    if (usageMeta?.pricing_free_units) {
      return `${usageMeta?.usage?.toLocaleString() ?? 0} / ${
        usageMeta?.pricing_free_units ?? 0
      } hours`
    } else {
      return `${usageMeta?.usage?.toLocaleString() ?? 0} hours`
    }
  }, [usageMeta])

  const sortedProjectAllocations = useMemo(() => {
    if (!usageMeta || !usageMeta.project_allocations) return []

    return usageMeta.project_allocations.sort((a, b) => b.usage - a.usage)
  }, [usageMeta])

  return (
    <HoverCard openDelay={50} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div className={className}>
          <Link href={`/org/${slug}/usage#${metric.anchor}`}>
            <div className="group flex items-center space-x-2">
              <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
                {metric.name}
              </p>
              <ChevronRight strokeWidth={1.5} size={16} className="transition" />
            </div>
          </Link>
          <span className="text-sm">{usageLabel}</span>&nbsp;
          {relativeToSubscription && usageMeta?.cost && usageMeta.cost > 0 ? (
            <span className="text-sm" translate="no">
              ({formatCurrency(usageMeta?.cost)})
            </span>
          ) : null}
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" className="w-[500px]" animate="slide-in">
        <div className="text-sm text-foreground space-y-2">
          <p className="font-medium" translate="no">
            {usageMeta?.unit_price_desc}
          </p>

          <div className="my-2">
            {usageMeta?.metric === ComputeUsageMetric.COMPUTE_HOURS_BRANCH ? (
              <p className="text-sm">
                Each Preview branch is a separate environment with all Supabase services (Database,
                Auth, Storage, etc.).{' '}
                <Link
                  href={`${DOCS_URL}/guides/platform/manage-your-usage/branching`}
                  target="_blank"
                  className="transition text-brand hover:text-brand-600 underline"
                >
                  Read more
                </Link>
              </p>
            ) : (
              <p className="text-sm">
                Every project is a dedicated server and database. For every hour your project is
                active, it incurs compute costs based on the compute size of your project. Paused
                projects do not incur compute costs.{' '}
                <Link
                  href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
                  target="_blank"
                  className="transition text-brand hover:text-brand-600 underline"
                >
                  Read more
                </Link>
              </p>
            )}
          </div>

          {usageMeta && sortedProjectAllocations.length > 0 && (
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
                  <td className="py-2 border-t text-left">Total (Hours)</td>
                  <td className="py-2 border-t text-right">
                    {formatUsage(usageMeta.metric as PricingMetric, {
                      usage: usageMeta.usage_original,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
