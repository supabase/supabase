import { useEntitlementsQuery } from 'data/entitlements/entitlements-query'
import { useMemo } from 'react'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'

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
    data: allEntitlements,
    isLoading: isLoadingEntitlements,
    isSuccess: isSuccessEntitlements,
  } = useEntitlementsQuery({ slug: finalOrgSlug! }, { enabled })

  const { hasAccess, entitlementValue } = useMemo((): {
    hasAccess: boolean
    entitlementValue: number | null
  } => {
    // If no organization slug, no access
    if (!finalOrgSlug) return { hasAccess: false, entitlementValue: null }

    const entitlement = allEntitlements?.find(
      (entitlement) => entitlement.feature.key === featureKey
    )
    const entitlementValue = entitlement?.value ?? null

    if (!entitlement) return { hasAccess: false, entitlementValue: null }

    return { hasAccess: entitlement.hasAccess, entitlementValue }
  }, [allEntitlements, featureKey, finalOrgSlug])

  const isLoading = shouldGetSelectedOrg ? isLoadingSelectedOrg : isLoadingEntitlements
  const isSuccess = shouldGetSelectedOrg
    ? isSuccessSelectedOrg && isSuccessEntitlements
    : isSuccessEntitlements

  return { hasAccess, entitlementValue, isLoading, isSuccess }
}
