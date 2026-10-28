import { useQuery } from '@tanstack/react-query'
import { getStringArrayFlag } from 'common'

import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

const NANO_ON_PAID_PLANS_CONFIGCAT_FLAG_KEY = 'orgsAllowedToLaunchNanoInstancesOnPaidPlans'

export function useIsNanoAllowedOnPaidPlan(): boolean {
  const { data: organization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })
  const organizationSlug = organization?.slug

  const { data: allowedOrgSlugs, isSuccess } = useQuery({
    queryKey: ['nano-on-paid-plans-configcat-flag', organizationSlug],
    queryFn: () => getStringArrayFlag(NANO_ON_PAID_PLANS_CONFIGCAT_FLAG_KEY, organizationSlug!),
    enabled: IS_PLATFORM && !!organizationSlug,
    staleTime: 5 * 60 * 1000,
  })

  if (!IS_PLATFORM || !isSuccess || !organizationSlug) return false

  return allowedOrgSlugs.includes(organizationSlug)
}
