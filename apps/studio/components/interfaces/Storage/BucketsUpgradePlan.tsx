import { ScaffoldSection } from 'components/layouts/Scaffold'
import { AlphaNotice } from 'components/ui/AlphaNotice'
import { UpgradePlanButton } from 'components/ui/UpgradePlanButton'
import { AnalyticsBucket as AnalyticsBucketIcon, VectorBucket as VectorBucketIcon } from 'icons'
import { BUCKET_TYPES } from './Storage.constants'

export const BucketsUpgradePlan = ({ type }: { type: 'analytics' | 'vector' }) => {
  return (
    <ScaffoldSection isFullWidth>
      <AlphaNotice
        entity={type === 'analytics' ? 'Analytics buckets' : 'Vector buckets'}
        feedbackUrl={
          type === 'analytics'
            ? 'https://github.com/orgs/supabase/discussions/40116'
            : 'https://github.com/orgs/supabase/discussions/40815'
        }
      />
      <aside className="border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-4 items-center text-center gap-1 text-balance">
        {type === 'analytics' ? (
          <AnalyticsBucketIcon size={24} strokeWidth={1.5} className="text-foreground-muted" />
        ) : (
          <VectorBucketIcon size={24} strokeWidth={1.5} className="text-foreground-muted" />
        )}
        <div className="flex flex-col gap-y-1 items-center text-center">
          <h3>
            {type === 'analytics'
              ? BUCKET_TYPES.analytics.valueProp
              : type === 'vector'
                ? BUCKET_TYPES.vectors.valueProp
                : undefined}
          </h3>
          <p className="text-foreground-light text-sm">
            Upgrade to Pro to use {type} buckets for your project
          </p>
        </div>
        <div className="flex items-center gap-x-2">
          <UpgradePlanButton type="primary" plan="Pro" />
        </div>
      </aside>
    </ScaffoldSection>
  )
}
