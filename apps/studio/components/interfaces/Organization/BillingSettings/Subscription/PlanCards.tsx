import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { plans as subscriptionsPlans } from 'shared-data/plans'

import { EnterpriseCard } from './EnterpriseCard'
import type { PlanPresentationVariant } from './plan-presentation'
import { PlanCard } from './PlanCard'
import { getPlanCardsEntryAnimation } from './PlanCards.utils'
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
  variant: PlanPresentationVariant
  /** Seconds to wait before the cards stagger in. Omit to render them without an entry animation. */
  entryDelay?: number
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
  variant,
  entryDelay,
  onSelectTier,
}: PlanCardsProps) {
  const router = useRouter()
  const track = useTrack()

  const entryAnimation = getPlanCardsEntryAnimation(entryDelay)

  return (
    <motion.div className="py-6 grid grid-cols-12 gap-3" {...entryAnimation.container}>
      {subscriptionsPlans.map((plan) => {
        const planMeta = availablePlans.find((p) => p.id === plan.id.split('tier_')[1])
        const price = planMeta?.price ?? 0
        const isDowngradeOption =
          getPlanChangeType(currentSubscriptionPlanId, plan?.planId) === 'downgrade'
        const isCurrentPlan = planMeta?.id === currentSubscriptionPlanId

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
              variants={entryAnimation.card}
            />
          )
        }

        return (
          <PlanCard
            key={plan.id}
            plan={plan}
            price={price}
            isCurrentPlan={isCurrentPlan}
            isDowngradeOption={isDowngradeOption}
            isLoadingPlans={isLoadingPlans}
            canUpdateSubscription={canUpdateSubscription}
            isPartnerBilledOrganization={isPartnerBilledOrganization}
            hasOrioleProjects={hasOrioleProjects}
            currentSubscriptionPlanId={currentSubscriptionPlanId}
            managedBy={selectedOrganization?.managed_by}
            shouldHighlight={shouldHighlight}
            variant={variant}
            variants={entryAnimation.card}
            onSelectTier={() => onSelectTier(plan.id as 'tier_free' | 'tier_pro' | 'tier_team')}
            onTrackCtaClick={() =>
              track('studio_pricing_plan_cta_clicked', {
                selectedPlan: plan.name,
                currentPlan: currentSubscriptionPlanName,
              })
            }
          />
        )
      })}
    </motion.div>
  )
}
