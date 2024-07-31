import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from './useSelectedOrganization'

export function useCurrentOrgPlan() {
  const currentOrg = useSelectedOrganization()
  const { data, isLoading, isSuccess } = useOrgSubscriptionQuery({
    orgSlug: currentOrg?.slug,
  })

  return {
    plan: data?.plan,
    isLoading,
    isSuccess,
    isFree: data?.plan.id === 'free',
    isPaid: data?.plan.id === 'pro' || data?.plan.id === 'team' || data?.plan.id === 'enterprise',
    isPro: data?.plan.id === 'pro',
    isTeam: data?.plan.id === 'team',
    isEnterprise: data?.plan.id === 'enterprise',
  }
}
