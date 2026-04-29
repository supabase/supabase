import { useParams } from 'common'

import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const useIsEnterpriseOrSupabaseOrg = () => {
  const { ref } = useParams()
  const { isLoading: isProjectLoading } = useProjectDetailQuery({ ref })
  const { data: org, isLoading: isOrgLoading } = useSelectedOrganizationQuery()
  const { data: subscription, isLoading: isSubscriptionLoading } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })

  const isLoading = isProjectLoading || isOrgLoading || (org !== undefined && isSubscriptionLoading)
  const isEligible = subscription?.plan?.id === 'enterprise' || org?.id === 1

  return { isLoading, isEligible }
}
