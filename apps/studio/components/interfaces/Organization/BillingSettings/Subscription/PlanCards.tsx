import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { plans as subscriptionsPlans } from 'shared-data/plans'

import { EnterpriseCard } from './EnterpriseCard'
import { isPlanChangeEligible, usePlanPresentationExperiment } from './plan-presentation'
import { PlanCard } from './PlanCard'
import { getPlanChangeType } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import type { OrgPlan, PlanId } from '@/data/subscriptions/types'
import { useTrack } from '@/lib/telemetry/track'
import type { Organization } from '@/types/base'

const planCardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export interface PlanCardsProps {
  availablePlans: OrgPlan[]
  isLoadingPlans: boolean
  currentSubscriptionPlanId: PlanId | undefined
  currentSubscriptionPlanName: string | undefined
  canUpdateSubscription: boolean
  isPartnerBilledOrganization: boolean
  hasOrioleProjects: boolean
  selectedOrganization: Organization | undefined
  onSelectTier: (tier: 'tier_free' | 'tier_pro' | 'tier_team') => void
  contentDelay?: number
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
  onSelectTier,
  contentDelay = 0,
}: PlanCardsProps) {
  const router = useRouter()
  const track = useTrack()

  const eligible = isPlanChangeEligible({
    managedBy: selectedOrganization?.managed_by,
    billingPartner: selectedOrganization?.billing_partner,
    currentPlanId: currentSubscriptionPlanId,
    canUpdateSubscription,
  })

  const variant = usePlanPresentationExperiment({ eligible })

  const planListVariants = {
    hidden: {},
    visible: { transition: { delayChildren: contentDelay + 0.2, staggerChildren: 0.08 } },
  }

  return (
    <motion.div
      className="py-6 grid grid-cols-12 gap-3"
      variants={planListVariants}
      initial="hidden"
      animate="visible"
    >
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
              variants={planCardVariants}
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
            variants={planCardVariants}
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
