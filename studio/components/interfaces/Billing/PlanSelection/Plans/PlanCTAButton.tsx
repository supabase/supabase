import { FC } from 'react'
import { Button, IconLoader } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useFlag } from 'hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from 'components/interfaces/Billing'
import Link from 'next/link'

interface Props {
  plan: any
  currentPlan?: StripeProduct
  onSelectPlan: (plan: any) => void
}

const PlanCTAButton: FC<Props> = ({ plan, currentPlan, onSelectPlan }) => {
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const getButtonType = (plan: any, currentPlan: any) => {
    if (['Free tier'].includes(plan.name)) {
      // Free is always default
      return 'default'
    } else if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.FREE) {
      // If the current plan is free, other plans are primary
      return 'primary'
    } else if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.TEAM && plan.name !== 'Team tier') {
      // Non-free plans are default (pro), when team tier is selected
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

    if (plan.id === STRIPE_PRODUCT_IDS.TEAM) {
      if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.TEAM) {
        return 'Edit plan configuration'
      } else if (
        [STRIPE_PRODUCT_IDS.FREE, STRIPE_PRODUCT_IDS.PRO, STRIPE_PRODUCT_IDS.PAYG].includes(
          currentPlan.prod_id
        )
      ) {
        return 'Upgrade to Team'
      } else {
        return 'Contact sales'
      }
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
    plan.id === STRIPE_PRODUCT_IDS.FREE && currentPlan.prod_id === STRIPE_PRODUCT_IDS.FREE

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
        {!disabled && projectUpdateDisabled && (
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200 w-[260px] flex items-center justify-center',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200 text-center">
                Subscription changes are currently disabled, our engineers are working on a fix
              </span>
            </div>
          </Tooltip.Content>
        )}
      </Tooltip.Root>
    </div>
  )
}

export default PlanCTAButton
