import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'

import { OrgUsageResponse } from 'data/usage/org-usage-query'
import { IconChevronRight, IconPieChart } from 'ui'
import { Metric } from './BillingBreakdown.constants'
import { formatUsage } from '../helpers'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import { useMemo } from 'react'

export interface ComputeMetricProps {
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
  relativeToSubscription: boolean
}

const ComputeMetric = ({ slug, metric, usage, relativeToSubscription }: ComputeMetricProps) => {
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)

  const usageLabel = useMemo(() => {
    if (usageMeta?.cost && usageMeta.cost > 0) {
      return `${usageMeta?.usage?.toLocaleString() ?? 0} hours`
    } else {
      return `${usageMeta?.usage?.toLocaleString() ?? 0} / ${
        usageMeta?.pricing_free_units ?? 0
      } hours`
    }
  }, [usageMeta])

  return (
    <div className="flex items-center justify-between">
      <div>
        <Link href={`/org/${slug}/usage#${metric.anchor}`}>
          <div className="group flex items-center space-x-2">
            <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
              {metric.name}
            </p>
            <IconChevronRight strokeWidth={1.5} size={16} className="transition" />
          </div>
        </Link>
        <span className="text-sm">{usageLabel}</span>&nbsp;
        {relativeToSubscription && usageMeta?.cost && usageMeta.cost > 0 ? (
          <span className="text-sm">(${usageMeta?.cost})</span>
        ) : null}
      </div>
      <div>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconPieChart className="h-8 w-8 p-1" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div className="rounded bg-alternative py-1 px-2 leading-none shadow border border-background min-w-[250px]">
                <div className="text-xs text-foreground max-w-sm space-y-2">
                  <p className="font-medium">{usageMeta?.unit_price_desc}</p>

                  {usageMeta?.project_allocations && usageMeta.project_allocations.length > 0 && (
                    <table className="list-disc w-full">
                      <thead>
                        <tr>
                          <th className="text-left">Project</th>
                          <th className="text-right">Usage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageMeta.project_allocations.map((allocation) => (
                          <tr key={`${usageMeta.metric}_${allocation.ref}`}>
                            <td>{allocation.name}</td>
                            <td className="text-right">
                              {formatUsage(usageMeta.metric as PricingMetric, allocation.usage)}
                            </td>
                          </tr>
                        ))}
                        <tr></tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="py-2 border-t text-left">Total (Hours)</td>
                          <td className="py-2 border-t text-right">
                            {formatUsage(
                              usageMeta.metric as PricingMetric,
                              usageMeta.usage_original
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}

                  <div className="mt-2">
                    <p className="text-xs">
                      Every project is a dedicated server and database. For every hour your project
                      is active, it incurs compute costs based on the instance size of your project.
                      Paused projects do not incur compute costs.
                    </p>
                  </div>
                </div>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </div>
  )
}

export default ComputeMetric
