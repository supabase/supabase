import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const useIsEnterpriseOrSupabaseOrg = () => {
  const { data: org } = useSelectedOrganizationQuery()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const isEnterprise = subscription?.plan?.id === 'enterprise'

  const { data: organizations } = useOrganizationsQuery()
  const isSupabaseOrg = organizations?.some((o) => o.id === 1) ?? false

  return isEnterprise || isSupabaseOrg
}
