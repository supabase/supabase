import { ScaffoldSection } from 'components/layouts/Scaffold'
import { UpgradePlanButton } from 'components/ui/UpgradePlanButton'
import { AnalyticsBucket as AnalyticsBucketIcon, VectorBucket as VectorBucketIcon } from 'icons'
import { EmptyStatePresentational } from 'ui-patterns'
import { AlphaNotice } from './AlphaNotice'
import { BUCKET_TYPES } from './Storage.constants'

export const BucketsUpgradePlan = ({ type }: { type: 'analytics' | 'vector' }) => {
  return (
    <ScaffoldSection isFullWidth>
      <AlphaNotice type={type} />
      <EmptyStatePresentational
        icon={type === 'analytics' ? AnalyticsBucketIcon : VectorBucketIcon}
        title={
          type === 'analytics'
            ? BUCKET_TYPES.analytics.valueProp
            : type === 'vector'
              ? BUCKET_TYPES.vectors.valueProp
              : undefined
        }
        description={`Upgrade to Pro to use ${type} buckets for your project`}
      >
        <div className="flex items-center gap-x-2">
          <UpgradePlanButton type="primary" plan="Pro" />
        </div>
      </EmptyStatePresentational>
    </ScaffoldSection>
  )
}
