import Link from 'next/link'

import { OrgUsageResponse } from 'data/usage/org-usage-query'
import { IconChevronRight } from 'ui'
import { Metric } from './BillingBreakdown.constants'

export interface ComputeUsageMetricProps {
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
}

const ComputeUsageMetric = ({ slug, metric, usage }: ComputeUsageMetricProps) => {
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)

  const usageCurrentLabel = `${usageMeta?.usage?.toLocaleString() ?? 0} hours`

  const usageCurrentLabel2 = `${usageMeta?.usage?.toLocaleString() ?? 0} / ${
    usageMeta?.pricing_free_units ?? 0
  } hours`

  const usageLabel = usageMeta?.cost && usageMeta.cost > 0 ? usageCurrentLabel : usageCurrentLabel2

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
        {usageMeta?.cost && usageMeta.cost > 0 ? (
          <span className="text-sm">(${usageMeta?.cost})</span>
        ) : null}
      </div>
    </div>
  )
}

export default ComputeUsageMetric
