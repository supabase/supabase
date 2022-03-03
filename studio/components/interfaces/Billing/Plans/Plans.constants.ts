import { BillingPlan } from './Plans.types'

export const BILLING_PLANS: BillingPlan[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Zero commitment, perfect for hobby projects and experiments',
    isPopular: false,
    pointers: [
      'Postgres database, API server, authentication, storage',
      'Unlimited team members',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: 25,
    description: 'Designated support team, account manager and technical specialist',
    isPopular: true,
    pointers: [
      'Optimized database instances',
      'Usage-based billing, no limits',
      'Automated back-ups',
      'Designated support',
      'Unlimited audit trails',
    ],
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Custom tailored services to suit your specific business needs',
    isPopular: false,
    pointers: [
      'Bespoked architecture',
      'SSO / SAML',
      'SOC2 security',
      'Automated scaling',
      'Dedicated support team & SLAs',
    ],
  },
]
