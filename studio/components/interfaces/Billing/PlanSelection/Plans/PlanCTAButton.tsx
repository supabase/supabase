import { FC } from 'react'
import { Button, IconLoader } from '@supabase/ui'

import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from '../..'
import Link from 'next/link'

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

  if (plan.name === 'Enterprise') {
    return (
      <Link href="https://supabase.com/contact/enterprise">
        <a>
          <Button disabled={disabled} type={type} block size="medium">
            {ctaText}
          </Button>
        </a>
      </Link>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <Button
        disabled={disabled}
        type={type}
        onClick={() => onSelectPlan(plan)}
        block
        size="medium"
      >
        {ctaText}
      </Button>
    </div>
  )
}

export default PlanCTAButton
