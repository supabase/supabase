import { FC } from 'react'
import { Button, IconLoader } from '@supabase/ui'

import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { BillingPlan } from './Plans.types'
import { StripeSubscription } from '../index'

interface Props {
  plan: BillingPlan
  currentPlan?: StripeSubscription
  onSelectPlan: (plan: BillingPlan) => void
}

const PlanCTAButton: FC<Props> = ({ plan, currentPlan, onSelectPlan }) => {
  const getButtonType = (plan: any) => {
    if (plan.name === 'Enterprise' || plan.id === STRIPE_PRODUCT_IDS.FREE) {
      return 'default'
    }
    return 'primary'
  }

  const getButtonText = (plan: any, currentPlan: any) => {
    if (plan.name === 'Enterprise') {
      return 'Contact sales'
    }
    if (plan.id === STRIPE_PRODUCT_IDS.FREE) {
      if (currentPlan.tier.prod_id === STRIPE_PRODUCT_IDS.FREE) {
        return 'Current plan'
      } else {
        return 'Downgrade to Free'
      }
    }
    if (plan.id === STRIPE_PRODUCT_IDS.PRO) {
      if (currentPlan.tier.prod_id === STRIPE_PRODUCT_IDS.FREE) {
        return 'Upgrade to Pro'
      } else if (currentPlan.tier.prod_id === STRIPE_PRODUCT_IDS.PRO) {
        return 'Edit plan configuration'
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

  const type = getButtonType(plan)
  const ctaText = getButtonText(plan, currentPlan)
  const disabled =
    plan.id === STRIPE_PRODUCT_IDS.FREE && currentPlan.tier.prod_id === STRIPE_PRODUCT_IDS.FREE

  return (
    <div className="flex items-center justify-center">
      <Button disabled={disabled} type={type} onClick={() => onSelectPlan(plan)}>
        {ctaText}
      </Button>
    </div>
  )
}

export default PlanCTAButton
