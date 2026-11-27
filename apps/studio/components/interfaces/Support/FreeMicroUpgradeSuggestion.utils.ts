import type { OrganizationPlanID } from '@/data/organizations/organization-query'

/** The free Micro upgrade applies to Nano projects on any paid plan. */
export const isEligibleForFreeMicroUpgrade = ({
  planId,
  computeSize,
}: {
  planId?: OrganizationPlanID
  computeSize?: string
}) => !!planId && planId !== 'free' && planId !== 'platform' && computeSize === 'nano'
