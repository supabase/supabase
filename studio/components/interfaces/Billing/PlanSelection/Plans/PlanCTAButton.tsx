import Link from 'next/link'
import { Button, IconLoader } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useFlag } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS, STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from 'components/interfaces/Billing'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'

interface PlanCTAButtonProps {
  plan: any
  currentPlan?: StripeProduct
  onSelectPlan: (plan: any) => void
}

const PlanCTAButton = ({ plan, currentPlan, onSelectPlan }: PlanCTAButtonProps) => {
  const isProjectActive = useIsProjectActive()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const isTeamTier = currentPlan?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM

  const getButtonType = (plan: any, currentPlan: any) => {
    if (
      currentPlan.supabase_prod_id !== PRICING_TIER_PRODUCT_IDS.ENTERPRISE &&
      plan.name === 'Enterprise'
    ) {
      return 'default'
    }

    if (['Free tier', 'Free plan'].includes(plan.name)) {
      // Free is always default
      return 'default'
    } else if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.FREE) {
      // If the current plan is free, other plans are primary
      return 'primary'
    } else if (
      currentPlan.prod_id === STRIPE_PRODUCT_IDS.TEAM &&
      !['Team tier', 'Team plan'].includes(plan.name)
    ) {
      // Non-free plans are default (pro), when team plan is selected
      return 'default'
    }

    return 'primary'
  }

  const getButtonText = (plan: any, currentPlan: StripeProduct) => {
    if (plan.name === 'Enterprise') {
      return 'Contact sales'
    }
    if (plan.id === STRIPE_PRODUCT_IDS.FREE) {
      if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.FREE) {
        return 'Current plan'
      } else {
        return 'Downgrade to Free'
      }
    }
    if (plan.id === STRIPE_PRODUCT_IDS.PRO) {
      if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.FREE) {
        return 'Upgrade to Pro'
      } else if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.TEAM) {
        return 'Downgrade to Pro'
      } else if (
        currentPlan.prod_id === STRIPE_PRODUCT_IDS.PRO ||
        currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG
      ) {
        return 'Edit plan configuration'
      } else {
        return 'Contact sales'
      }
    }

    if (plan.id === STRIPE_PRODUCT_IDS.TEAM && currentPlan.prod_id === STRIPE_PRODUCT_IDS.TEAM) {
      return 'Edit plan configuration'
    } else {
      return 'Contact sales'
    }
  }

  if (!currentPlan)
    return (
      <div className="flex items-center justify-center">
        <Button type="text">
          <IconLoader size={18} className="animate-spin" />
        </Button>
      </div>
    )

  const type = getButtonType(plan, currentPlan)
  const ctaText = getButtonText(plan, currentPlan)
  const disabled =
    (!isProjectActive && plan.name !== 'Enterprise') ||
    (isTeamTier && plan.name !== 'Enterprise' && !['Team tier', 'Team plan'].includes(plan.name)) ||
    (plan.id === STRIPE_PRODUCT_IDS.FREE && currentPlan.prod_id === STRIPE_PRODUCT_IDS.FREE)

  if (plan.name === 'Enterprise') {
    return (
      <Link href="https://supabase.com/contact/enterprise">
        <a>
          <Button disabled={disabled} type={type} block>
            {ctaText}
          </Button>
        </a>
      </Link>
    )
  }

  if (!isTeamTier && plan.name === 'Team plan') {
    return (
      <Link href="https://forms.supabase.com/team">
        <a>
          <Button disabled={disabled} type={type} block>
            {ctaText}
          </Button>
        </a>
      </Link>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger className="w-full">
          <Button
            block
            type={type}
            disabled={disabled || projectUpdateDisabled}
            onClick={() => onSelectPlan(plan)}
          >
            {ctaText}
          </Button>
        </Tooltip.Trigger>
        {((disabled && isTeamTier) || projectUpdateDisabled || !isProjectActive) && (
          <Tooltip.Portal>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200 w-[260px] flex items-center justify-center',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200 text-center">
                    {projectUpdateDisabled
                      ? 'Subscription changes are currently disabled, our engineers are working on a fix'
                      : !isProjectActive
                      ? 'Unable to update subscription as project is not active'
                      : isTeamTier
                      ? "Unable to update subscription from Team tier. Please reach out to us via support if you'd like to change your plan"
                      : ''}
                  </span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </div>
  )
}

export default PlanCTAButton
