'use client'

import PricingComparisonTable from '~/components/Pricing/PricingComparisonTable'
import { useOrganizations } from '~/data/organizations'

export default function PricingComparisonSection() {
  const { isLoading, organizations } = useOrganizations()
  const hasExistingOrganizations = !isLoading && organizations.length > 0

  return (
    <PricingComparisonTable
      organizations={organizations}
      hasExistingOrganizations={hasExistingOrganizations}
    />
  )
}
