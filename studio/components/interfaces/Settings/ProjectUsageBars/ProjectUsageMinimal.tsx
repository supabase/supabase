import { FC } from 'react'
import { Loading } from '@supabase/ui'

import { useProjectSubscription, useProjectUsage } from 'hooks'
import { formatBytes } from 'lib/helpers'
import { PRICING_TIER_PRODUCT_IDS, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import SparkBar from 'components/ui/SparkBar'
import { usageBasedItems } from './ProjectUsageBars.constants'
import { UsageStats } from './ProjectUsageBars.types'

interface ProjectUsageMinimalProps {
  projectRef?: string
  filter: string
}

// [Joshen TODO] Need to update to use the newer usageBasedItems from constants
const ProjectUsageMinimal: FC<ProjectUsageMinimalProps> = ({ projectRef, filter }) => {
  const { usage, error: usageError, isLoading } = useProjectUsage(projectRef)
  const { subscription, error } = useProjectSubscription(projectRef)

  const stats: UsageStats = {
    authUsers: Number(usage?.authUsers),
    bucketSize: Number(usage?.bucketSize),
    dbSize: Number(usage?.dbSize),
    dbTables: Number(usage?.dbTables),
  }

  // [Joshen TODO] After API is ready need to update to include dbEgress, storageEgress
  // And also to highlight in this chart which components are "approaching" and "over"
  const mockUsage: any = {
    dbSize: { usage: 20773283, limit: 524288000 },
    dbEgress: { usage: 400000000, limit: 524288000 },
    storageSize: { usage: 624288000, limit: 524288000 },
    storageEgress: { usage: 2048, limit: 524288000 },
  }

  if (subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PAYG) {
    return <></>
  }

  const tier =
    subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PRO ? 'pro' : 'free'

  const product = usageBasedItems.find((item) => item.title === filter)
  if (!product) return <></>

  return (
    <Loading active={isLoading}>
      <div className="space-y-4">
        {product.features.map((feature) => {
          // [Joshen TODO] Update to use actual usage endpoint
          const featureUsage = mockUsage[feature.key]
          const usageRatio = featureUsage.usage / featureUsage.limit
          const isApproaching = usageRatio >= USAGE_APPROACHING_THRESHOLD
          const isExceeded = usageRatio >= 1

          return (
            <div key={feature.key} className="space-y-1">
              <h5 className="text-scale-1200 text-sm">{feature.title}</h5>
              <SparkBar
                type="horizontal"
                barClass={`${
                  isExceeded ? 'bg-red-900' : isApproaching ? 'bg-yellow-900' : 'bg-brand-900'
                }`}
                value={featureUsage.usage}
                max={featureUsage.limit}
                labelBottom={formatBytes(featureUsage.usage)}
                labelTop={formatBytes(featureUsage.limit)}
              />
            </div>
          )
        })}
      </div>
    </Loading>
  )
}

export default ProjectUsageMinimal
