import { STRIPE_PRODUCT_IDS } from 'lib/constants'

// On the UI, we hide PAYG, and add an Enterprise option
export const formatTierOptions = (tiers: any[]) => {
  const enterpriseOption = {
    id: 'Enterprise',
    name: 'Enterprise',
    description: 'For large-scale applications managing serious workloads',
    metadata: {
      features:
        'Point in time recovery\\nDesignated Support manager & SLAs\\nSSO / SAML + SOC2\\nCustom contracts & invoicing\\n24×7×365 premium enterprise support',
    },
    prices: [],
  }

  // Fix the order of plans here
  return tiers
    .filter((tier: any) => tier.id === STRIPE_PRODUCT_IDS.FREE)
    .concat(tiers.filter((tier: any) => tier.id === STRIPE_PRODUCT_IDS.PRO))
    .concat([enterpriseOption])
}
