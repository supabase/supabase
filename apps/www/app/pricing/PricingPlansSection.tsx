'use client'

import PricingPlans from '~/components/Pricing/PricingPlans'
import { useOrganizations } from '~/data/organizations'

export default function PricingPlansSection() {
  const { isLoading, organizations } = useOrganizations()
  const hasExistingOrganizations = !isLoading && organizations.length > 0

  return (
    <PricingPlans
      organizations={organizations}
      hasExistingOrganizations={hasExistingOrganizations}
    />
  )
}
