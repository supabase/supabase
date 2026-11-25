import { useRouter } from 'next/router'
import { plans as subscriptionsPlans } from 'shared-data/plans'

import { AwsMarketplacePurchaseCallout } from './AwsMarketplacePurchaseCallout'
import { EnterpriseCard } from './EnterpriseCard'
import { PlanCard } from './PlanCard'
import { getLiftedSide } from './PlanCards.utils'
import { getPlanChangeType } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import type { OrgPlan, PlanId } from '@/data/subscriptions/types'
import { useTrack } from '@/lib/telemetry/track'
import type { Organization } from '@/types/base'

export interface PlanCardsProps {
  availablePlans: OrgPlan[]
  isLoadingPlans: boolean
  currentSubscriptionPlanId: PlanId | undefined
  currentSubscriptionPlanName: string | undefined
  canUpdateSubscription: boolean
  isPartnerBilledOrganization: boolean
  hasOrioleProjects: boolean
  selectedOrganization: Organization | undefined
  showAwsMarketplacePurchase?: boolean
  isPlanUpdateRedesignEnabled: boolean
  onSelectTier: (tier: 'tier_free' | 'tier_pro' | 'tier_team') => void
}

export function PlanCards({
  availablePlans,
  isLoadingPlans,
  currentSubscriptionPlanId,
  currentSubscriptionPlanName,
  canUpdateSubscription,
  isPartnerBilledOrganization,
  hasOrioleProjects,
  selectedOrganization,
  showAwsMarketplacePurchase = false,
  isPlanUpdateRedesignEnabled,
  onSelectTier,
}: PlanCardsProps) {
  const router = useRouter()
  const track = useTrack()

  const currentPlanIndex = subscriptionsPlans.findIndex(
    (plan) => plan.planId === currentSubscriptionPlanId
  )

  return (
    <div className="w-full py-6 grid grid-cols-12 gap-3 xl:gap-x-0">
      {subscriptionsPlans.map((plan, index) => {
        const planMeta = availablePlans.find((p) => p.id === plan.id.split('tier_')[1])
        const price = planMeta?.price ?? 0
        const isDowngradeOption =
          getPlanChangeType(currentSubscriptionPlanId, plan?.planId) === 'downgrade'
        const isCurrentPlan = index === currentPlanIndex
        const liftedSide = getLiftedSide({ index, liftedIndex: currentPlanIndex })

        const source = Array.isArray(router.query.source)
          ? router.query.source[0]
          : router.query.source
        const shouldHighlight = source === 'log-drains-empty-state' && plan.id === 'tier_pro'

        if (plan.id === 'tier_enterprise') {
          return (
            <EnterpriseCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isCurrentPlan}
              liftedSide={liftedSide}
              isPlanUpdateRedesignEnabled={isPlanUpdateRedesignEnabled}
              origin={source}
            />
          )
        }

        return (
          <PlanCard
            key={plan.id}
            plan={plan}
            price={price}
            isCurrentPlan={isCurrentPlan}
            liftedSide={liftedSide}
            isDowngradeOption={isDowngradeOption}
            isLoadingPlans={isLoadingPlans}
            canUpdateSubscription={canUpdateSubscription}
            isPartnerBilledOrganization={isPartnerBilledOrganization}
            hasOrioleProjects={hasOrioleProjects}
            currentSubscriptionPlanId={currentSubscriptionPlanId}
            managedBy={selectedOrganization?.managed_by}
            shouldHighlight={shouldHighlight}
            onSelectTier={() => onSelectTier(plan.id as 'tier_free' | 'tier_pro' | 'tier_team')}
            onTrackCtaClick={() =>
              track('studio_pricing_plan_cta_clicked', {
                selectedPlan: plan.name,
                currentPlan: currentSubscriptionPlanName,
                planUpdateRedesignEnabled: isPlanUpdateRedesignEnabled,
                origin: source,
              })
            }
          />
        )
      })}
      {showAwsMarketplacePurchase && (
        <div className="col-span-12">
          <AwsMarketplacePurchaseCallout />
        </div>
      )}
    </div>
  )
}
