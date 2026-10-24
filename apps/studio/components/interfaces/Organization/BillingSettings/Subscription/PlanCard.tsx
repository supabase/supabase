import { isArray } from 'lodash'
import { CheckIcon } from 'lucide-react'
import { motion, type Variants } from 'motion/react'
import type { PricingInformation } from 'shared-data'
import { Button, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { RequestUpgradeToBillingOwners } from '@/components/ui/RequestUpgradeToBillingOwners'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { formatCurrency } from '@/lib/helpers'

export interface PlanCardProps {
  plan: PricingInformation
  price: number
  isCurrentPlan: boolean
  isDowngradeOption: boolean
  isLoadingPlans: boolean
  canUpdateSubscription: boolean
  isPartnerBilledOrganization: boolean
  hasOrioleProjects: boolean
  currentSubscriptionPlanId: string | undefined
  managedBy: string | undefined
  shouldHighlight: boolean
  variants?: Variants
  onSelectTier: () => void
  onTrackCtaClick: () => void
}

export function PlanCard({
  plan,
  price,
  isCurrentPlan,
  isDowngradeOption,
  isLoadingPlans,
  canUpdateSubscription,
  isPartnerBilledOrganization,
  hasOrioleProjects,
  currentSubscriptionPlanId,
  managedBy,
  shouldHighlight,
  variants,
  onSelectTier,
  onTrackCtaClick,
}: PlanCardProps) {
  const features = plan.features
  const footer = plan.footer

  const ctaButton = isCurrentPlan ? (
    <Button block disabled>
      Current plan
    </Button>
  ) : !canUpdateSubscription &&
    !isDowngradeOption &&
    (plan.name === 'Pro' || plan.name === 'Team') ? (
    <RequestUpgradeToBillingOwners block plan={plan.name} />
  ) : (
    <ButtonTooltip
      block
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
      {isDowngradeOption ? 'Downgrade' : 'Upgrade'} to {plan.name}
    </ButtonTooltip>
  )

  return (
    <motion.div
      variants={variants}
      className={cn(
        'flex flex-col items-start justify-between',
        'border rounded-md col-span-12 md:col-span-4 bg-surface-200',
        shouldHighlight &&
          'ring-4 ring-primary-bright animate-[pulse_1.5s_ease-in-out_1] motion-reduce:animate-none shadow-md shadow-primary-bright/40'
      )}
    >
      <div className="w-full px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pb-2">
            <h3 className="text-foreground text-xl font-normal uppercase font-mono">{plan.name}</h3>
            {isCurrentPlan ? (
              <span className="text-xs bg-surface-300 text-foreground-light rounded-sm px-2 py-0.5">
                Current plan
              </span>
            ) : plan.nameBadge ? (
              <span className="bg-foreground-light text-background rounded-md py-0.5 px-2 text-[13px] leading-4">
                {plan.nameBadge}
              </span>
            ) : null}
          </div>
        </div>

        <p className="text-foreground-light text-[13px] leading-4 mb-4 min-h-12 line-clamp-3">
          {plan.description}
        </p>

        {ctaButton}

        <div className="border-t my-4" />

        <div className="flex items-end gap-1 pb-4">
          <div>
            <p
              className={cn(
                'text-foreground-lighter text-[13px] leading-4',
                (price ?? 0) <= 0 && 'invisible'
              )}
            >
              From
            </p>
            <div className="flex items-end">
              {isLoadingPlans ? (
                <div className="h-[40px] flex items-center justify-center">
                  <ShimmeringLoader className="w-[60px] h-[32px]" />
                </div>
              ) : (
                <p className="text-foreground text-3xl font-mono" translate="no">
                  {formatCurrency(price)}
                </p>
              )}
              <p className="text-foreground-lighter mb-0.5 ml-1 text-[13px] leading-4">
                {plan.costUnit}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col px-4 pb-4">
        {plan.preface && (
          <p className="text-foreground-lighter text-[13px] mt-2 mb-4">{plan.preface}</p>
        )}
        <ul className="text-[13px] flex-1">
          {features.map((feature) => (
            <li
              key={typeof feature === 'string' ? feature : feature[0]}
              className="flex flex-col py-2 first:mt-0"
            >
              <div className="flex items-center">
                <div className="flex w-5">
                  <CheckIcon className="h-4 w-4 text-primary" aria-hidden="true" strokeWidth={3} />
                </div>
                <span className="text-foreground">
                  {typeof feature === 'string' ? feature : feature[0]}
                </span>
              </div>
              {typeof feature !== 'string' && isArray(feature) && (
                <p className="ml-5 text-foreground-lighter">{feature[1]}</p>
              )}
            </li>
          ))}
        </ul>

        {footer && (
          <div className="border-t pt-4 mt-auto">
            <p className="text-foreground-lighter text-[13px] whitespace-pre-wrap">{footer}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
