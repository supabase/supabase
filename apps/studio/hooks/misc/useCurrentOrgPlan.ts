import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from './useSelectedOrganization'

export function useCurrentOrgPlan() {
  const currentOrg = useSelectedOrganization()
  const { data, isLoading, isSuccess } = useOrgSubscriptionQuery({
    orgSlug: currentOrg?.slug,
  })

  if (isLoading) {
    return {
      plan: null,
      usageBillingEnabled: null,
      isLoading,
      isSuccess: false,
    }
  } else {
    return {
      plan: data?.plan,
      usageBillingEnabled: data?.usage_billing_enabled,
      isLoading,
      isSuccess,
    }
  }
}
