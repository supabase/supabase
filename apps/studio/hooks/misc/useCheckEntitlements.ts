import { useEntitlementsQuery } from 'data/entitlements/entitlements-query'
import { useMemo } from 'react'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import type { EntitlementConfig } from 'data/entitlements/entitlements-query'

export function useCheckEntitlements(
  featureKey: string,
  organizationSlug?: string,
  options?: {
    enabled?: boolean
  }
) {
  // If no organizationSlug provided, try to get it from the selected organization
  const shouldGetSelectedOrg = !organizationSlug && options?.enabled !== false
  const {
    data: selectedOrg,
    isLoading: isLoadingSelectedOrg,
    isSuccess: isSuccessSelectedOrg,
  } = useSelectedOrganizationQuery({
    enabled: shouldGetSelectedOrg,
  })

  const finalOrgSlug = organizationSlug || selectedOrg?.slug
  const enabled = options?.enabled !== false && !!finalOrgSlug

  const {
    data: entitlementsData,
    isLoading: isLoadingEntitlements,
    isSuccess: isSuccessEntitlements,
  } = useEntitlementsQuery({ slug: finalOrgSlug! }, { enabled })

  const { hasAccess, entitlementConfig } = useMemo((): {
    hasAccess: boolean
    entitlementConfig: EntitlementConfig
  } => {
    // If no organization slug, no access
    if (!finalOrgSlug) return { hasAccess: false, entitlementConfig: { enabled: false } }

    const entitlement = entitlementsData?.entitlements.find(
      (entitlement) => entitlement.feature.key === featureKey
    )
    const entitlementConfig = entitlement?.config ?? { enabled: false }

    if (!entitlement) return { hasAccess: false, entitlementConfig: { enabled: false } }

    return { hasAccess: entitlement.hasAccess, entitlementConfig }
  }, [entitlementsData, featureKey, finalOrgSlug])

  const isLoading = shouldGetSelectedOrg ? isLoadingSelectedOrg : isLoadingEntitlements
  const isSuccess = shouldGetSelectedOrg
    ? isSuccessSelectedOrg && isSuccessEntitlements
    : isSuccessEntitlements

  return { hasAccess, entitlementConfig, isLoading, isSuccess }
}
