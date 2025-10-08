import { useSelectedOrganizationQuery } from './useSelectedOrganization'

export function useCurrentOrgPlan() {
  const { data: currentOrg } = useSelectedOrganizationQuery()

  if (!currentOrg) {
    return {
      plan: null,
      usageBillingEnabled: null,
      isLoading: true,
      isSuccess: false,
    }
  } else {
    return {
      plan: currentOrg?.plan,
      usageBillingEnabled: currentOrg?.usage_billing_enabled,
      isLoading: false,
      isSuccess: true,
    }
  }
}
