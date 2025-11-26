import { ScaffoldSection } from 'components/layouts/Scaffold'
import { EmptyState } from 'components/ui/EmptyState'
import { UpgradePlanButton } from 'components/ui/UpgradePlanButton'
import { AnalyticsBucket as AnalyticsBucketIcon, VectorBucket as VectorBucketIcon } from 'icons'
import { AlphaNotice } from './AlphaNotice'
import { BUCKET_TYPES } from './Storage.constants'

export const BucketsUpgradePlan = ({ type }: { type: 'analytics' | 'vector' }) => {
  return (
    <ScaffoldSection isFullWidth>
      <AlphaNotice type={type} />
      <EmptyState
        icon={type === 'analytics' ? AnalyticsBucketIcon : VectorBucketIcon}
        title={
          type === 'analytics'
            ? BUCKET_TYPES.analytics.valueProp
            : type === 'vector'
              ? BUCKET_TYPES.vectors.valueProp
              : undefined
        }
        description={`Upgrade to Pro to use ${type} buckets for your project`}
        contentClassName="gap-y-1"
        className="gap-y-4"
      >
        <div className="flex items-center gap-x-2">
          <UpgradePlanButton type="primary" plan="Pro" />
        </div>
      </EmptyState>
    </ScaffoldSection>
  )
}
