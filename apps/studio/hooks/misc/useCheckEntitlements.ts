import { useEntitlementsQuery } from 'data/entitlements/entitlements-query'
import { useMemo } from 'react'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import type { EntitlementConfig, EntitlementType } from 'data/entitlements/entitlements-query'

function isNumericConfig(
  config: EntitlementConfig,
  type: EntitlementType
): config is { enabled: boolean; unlimited: boolean; value: number } {
  return type === 'numeric'
}

function isSetConfig(
  config: EntitlementConfig,
  type: EntitlementType
): config is { enabled: boolean; set: string[] } {
  return type === 'set'
}

function isBooleanConfig(
  config: EntitlementConfig,
  type: EntitlementType
): config is { enabled: boolean } {
  return type === 'boolean'
}

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

  const { hasAccess, entitlementConfig, entitlementType } = useMemo((): {
    hasAccess: boolean
    entitlementConfig: EntitlementConfig | null
    entitlementType: EntitlementType | null
  } => {
    // If no organization slug, no access
    if (!finalOrgSlug) return { hasAccess: false, entitlementConfig: null, entitlementType: null }

    const entitlement = entitlementsData?.entitlements.find(
      (entitlement) => entitlement.feature.key === featureKey
    )
    const entitlementConfig = entitlement?.config ?? null

    if (!entitlement) return { hasAccess: false, entitlementConfig, entitlementType: null }

    return { hasAccess: entitlement.hasAccess, entitlementConfig, entitlementType: entitlement.type }
  }, [entitlementsData, featureKey, finalOrgSlug])

  const isLoading = shouldGetSelectedOrg ? isLoadingSelectedOrg : isLoadingEntitlements
  const isSuccess = shouldGetSelectedOrg
    ? isSuccessSelectedOrg && isSuccessEntitlements
    : isSuccessEntitlements

  return {
    hasAccess,
    isLoading,
    isSuccess,
    getEntitlementNumericValue: () =>
      entitlementConfig && entitlementType && isNumericConfig(entitlementConfig, entitlementType) ? entitlementConfig.value : undefined,
    isEntitlementUnlimited: () =>
      entitlementConfig && entitlementType && isNumericConfig(entitlementConfig, entitlementType) ? entitlementConfig.unlimited : false,
    getEntitlementSetValues: () => entitlementConfig && entitlementType && isSetConfig(entitlementConfig, entitlementType) ? entitlementConfig.set : [],
  }
}
