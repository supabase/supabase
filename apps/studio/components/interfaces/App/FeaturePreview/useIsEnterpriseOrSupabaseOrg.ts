import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const useIsEnterpriseOrSupabaseOrg = () => {
  const { data: org, isLoading: isOrgLoading } = useSelectedOrganizationQuery()
  const { data: subscription, isLoading: isSubscriptionLoading } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })

  const isLoading = isOrgLoading || (org !== undefined && isSubscriptionLoading)
  const isEligible = subscription?.plan?.id === 'enterprise' || org?.id === 1

  return { isLoading, isEligible }
}
