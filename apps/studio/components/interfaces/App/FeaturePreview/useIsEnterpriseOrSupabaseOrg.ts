import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const useIsEnterpriseOrSupabaseOrg = () => {
  const { data: org } = useSelectedOrganizationQuery()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const isEnterprise = subscription?.plan?.id === 'enterprise'
  const isSupabaseOrg = org?.id === 1

  return isEnterprise || isSupabaseOrg
}
