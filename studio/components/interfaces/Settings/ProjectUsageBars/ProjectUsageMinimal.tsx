import { FC } from 'react'
import { Loading } from 'ui'

import { ProjectUsageResponseUsageKeys, useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { formatBytes } from 'lib/helpers'
import { PRICING_TIER_PRODUCT_IDS, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import SparkBar from 'components/ui/SparkBar'
import { USAGE_BASED_PRODUCTS } from 'components/interfaces/Billing/Billing.constants'

interface ProjectUsageMinimalProps {
  projectRef?: string
  filter: string
}

// [Joshen] This is currently not being used anywhere as of 011122

const ProjectUsageMinimal: FC<ProjectUsageMinimalProps> = ({ projectRef, filter }) => {
  const { data: usage, error: usageError, isLoading } = useProjectUsageQuery({ projectRef })
  const { data: subscription, error: subscriptionError } = useProjectSubscriptionQuery({
    projectRef,
  })

  if (
    subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PAYG ||
    subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE ||
    subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM
  ) {
    return <></>
  }

  const product = USAGE_BASED_PRODUCTS.find((item) => item.title === filter)
  if (!product) return <></>

  if (usageError || subscriptionError) {
    return <div></div>
  }

  return (
    <Loading active={isLoading}>
      {usage && (
        <div className="space-y-8">
          {product.features.map((feature) => {
            const featureUsage = usage[feature.key as ProjectUsageResponseUsageKeys]
            const usageRatio = (featureUsage.usage ?? 0) / featureUsage.limit
            const isApproaching = usageRatio >= USAGE_APPROACHING_THRESHOLD
            const isExceeded = usageRatio >= 1

            return (
              <div key={feature.key} className="space-y-1">
                <h5 className="text-sm text-scale-1200">{feature.title}</h5>
                <SparkBar
                  type="horizontal"
                  barClass={`${
                    isExceeded ? 'bg-red-900' : isApproaching ? 'bg-yellow-900' : 'bg-brand-900'
                  }`}
                  value={featureUsage.usage ?? 0}
                  max={featureUsage.limit}
                  labelBottom={formatBytes(featureUsage.usage)}
                  labelTop={formatBytes(featureUsage.limit)}
                />
              </div>
            )
          })}
        </div>
      )}
    </Loading>
  )
}

export default ProjectUsageMinimal
