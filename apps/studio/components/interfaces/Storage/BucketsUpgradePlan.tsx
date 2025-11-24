import { ScaffoldSection } from 'components/layouts/Scaffold'
import { UpgradePlanButton } from 'components/ui/UpgradePlanButton'
import { Bucket } from 'icons'
import { AlphaNotice } from './AlphaNotice'
import { BUCKET_TYPES } from './Storage.constants'

export const BucketsUpgradePlan = ({ type }: { type: 'analytics' | 'vector' }) => {
  return (
    <ScaffoldSection isFullWidth>
      <AlphaNotice type={type} />
      <aside className="border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-4 items-center text-center gap-1 text-balance">
        <Bucket size={24} strokeWidth={1.5} className="text-foreground-light" />
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
