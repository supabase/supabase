import type { PricingInformation } from 'shared-data'
import { Button, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { PlanColumn } from './PlanColumn'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { RequestUpgradeToBillingOwners } from '@/components/ui/RequestUpgradeToBillingOwners'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { formatCurrency } from '@/lib/helpers'

export interface PlanCardProps {
  plan: PricingInformation
  price: number
  isCurrentPlan: boolean
  liftedSide?: 'left' | 'right'
  isDowngradeOption: boolean
  isLoadingPlans: boolean
  canUpdateSubscription: boolean
  isPartnerBilledOrganization: boolean
  hasOrioleProjects: boolean
  currentSubscriptionPlanId: string | undefined
  managedBy: string | undefined
  shouldHighlight: boolean
  onSelectTier: () => void
  onTrackCtaClick: () => void
}

export function PlanCard({
  plan,
  price,
  isCurrentPlan,
  liftedSide,
  isDowngradeOption,
  isLoadingPlans,
  canUpdateSubscription,
  isPartnerBilledOrganization,
  hasOrioleProjects,
  currentSubscriptionPlanId,
  managedBy,
  shouldHighlight,
  onSelectTier,
  onTrackCtaClick,
}: PlanCardProps) {
  const ctaButton = isCurrentPlan ? (
    <Button block size="large" disabled>
      Current plan
    </Button>
  ) : !canUpdateSubscription &&
    !isDowngradeOption &&
    (plan.name === 'Pro' || plan.name === 'Team') ? (
    <RequestUpgradeToBillingOwners block size="large" variant="primary" plan={plan.name} />
  ) : (
    <ButtonTooltip
      block
      size="large"
      variant={isDowngradeOption ? 'default' : 'primary'}
      disabled={
        (!canUpdateSubscription && isDowngradeOption) ||
        currentSubscriptionPlanId === 'enterprise' ||
        currentSubscriptionPlanId === 'platform' ||
        (isPartnerBilledOrganization && plan.id !== 'tier_free') ||
        managedBy === MANAGED_BY.AWS_MARKETPLACE ||
        hasOrioleProjects
      }
      onClick={() => {
        onSelectTier()
        onTrackCtaClick()
      }}
      tooltip={{
        content: {
          side: 'bottom' as const,
          className: hasOrioleProjects ? 'w-96 text-center' : '',
          text:
            !canUpdateSubscription && isDowngradeOption
              ? "You need additional permissions to change your organization's plan"
              : currentSubscriptionPlanId === 'enterprise' ||
                  currentSubscriptionPlanId === 'platform'
                ? 'Reach out to us via support to update your plan'
                : hasOrioleProjects
                  ? 'Your organization has projects that are using the OrioleDB extension which is only available on the Free plan. Remove all OrioleDB projects before changing your plan.'
                  : managedBy === MANAGED_BY.AWS_MARKETPLACE
                    ? 'You cannot change the plan for an organization managed by AWS Marketplace'
                    : undefined,
        },
      }}
    >
      {isDowngradeOption ? <span>Downgrade</span> : <span>Upgrade</span>} <span>to</span>{' '}
      {plan.name}
    </ButtonTooltip>
  )

  return (
    <PlanColumn
      plan={plan}
      isCurrentPlan={isCurrentPlan}
      liftedSide={liftedSide}
      className={cn(
        shouldHighlight &&
          'ring-4 ring-primary-bright animate-[pulse_1.5s_ease-in-out_1] motion-reduce:animate-none shadow-md shadow-primary-bright/40'
      )}
      price={
        isLoadingPlans ? (
          <ShimmeringLoader className="w-20 h-10" />
        ) : (
          <p className="text-foreground text-5xl font-mono" translate="no">
            {formatCurrency(price)}
          </p>
        )
      }
      cta={ctaButton}
    />
  )
}
