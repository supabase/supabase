import { FC } from 'react'
import { Button, IconLoader } from '@supabase/ui'

import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from '../..'

interface Props {
  plan: any
  currentPlan?: StripeProduct
  onSelectPlan: (plan: any) => void
}

const PlanCTAButton: FC<Props> = ({ plan, currentPlan, onSelectPlan }) => {
  const getButtonType = (plan: any) => {
    if (plan.name === 'Enterprise' || plan.id === STRIPE_PRODUCT_IDS.FREE) {
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
      } else if (
        currentPlan.prod_id === STRIPE_PRODUCT_IDS.PRO ||
        currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG
      ) {
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
    plan.id === STRIPE_PRODUCT_IDS.FREE && currentPlan.prod_id === STRIPE_PRODUCT_IDS.FREE

  return (
    <div className="flex items-center justify-center">
      <Button disabled={disabled} type={type} onClick={() => onSelectPlan(plan)}>
        {ctaText}
      </Button>
    </div>
  )
}

export default PlanCTAButton
