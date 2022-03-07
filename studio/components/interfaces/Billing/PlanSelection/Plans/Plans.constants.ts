import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { BillingPlan } from './Plans.types'

// [Joshen] The idea is that API fetch plans will probably receive StripeProduct[]
// FE will keep the other meta information like description, pointers, but everything else
// should be from the API (e.g price) and name

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: STRIPE_PRODUCT_IDS.FREE,
    name: 'Free',
    price: 0,
    description: 'Zero commitment, perfect for hobby projects and experiments',
    isPopular: false,
    pointers: [
      '500MB database & 1GB file storage',
      '2000 monthly active auth users',
      'Community support',
    ],
  },
  {
    id: STRIPE_PRODUCT_IDS.PRO,
    name: 'Pro',
    price: 25,
    description: 'Designated support team, account manager and technical specialist',
    isPopular: true,
    pointers: [
      '8GB database & 100GB file storage',
      '10,000 monthly active auth users',
      'Daily backups',
      'Compute booster packs',
      '7-day log retention',
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    price: null,
    description: 'Custom tailored services to suit your specific business needs',
    isPopular: false,
    pointers: [
      'Point in time recovery',
      'Designated Support manager & SLAs',
      'SSO / SAML + SOC2',
      'Custom contracts & invoicing',
      '24×7×365 premium enterprise support',
    ],
  },
]
