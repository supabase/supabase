import { useEntitlementsQuery } from 'data/entitlements/entitlements-query'
import { useMemo } from 'react'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import type {
  Entitlement,
  EntitlementConfig,
  EntitlementType,
} from 'data/entitlements/entitlements-query'

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

function getEntitlementNumericValue(entitlement: Entitlement | null): number | undefined {
  const entitlementConfig = entitlement?.config
  return entitlementConfig &&
    entitlement.type &&
    isNumericConfig(entitlementConfig, entitlement.type)
    ? entitlementConfig.value
    : undefined
}

function isEntitlementUnlimited(entitlement: Entitlement | null): boolean {
  const entitlementConfig = entitlement?.config
  return entitlementConfig &&
    entitlement.type &&
    isNumericConfig(entitlementConfig, entitlement.type)
    ? entitlementConfig.unlimited
    : false
}

function getEntitlementSetValues(entitlement: Entitlement | null): string[] {
  const entitlementConfig = entitlement?.config
  return entitlementConfig && entitlement.type && isSetConfig(entitlementConfig, entitlement.type)
    ? entitlementConfig.set
    : []
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

  const { entitlement } = useMemo((): {
    entitlement: Entitlement | null
  } => {
    // If no organization slug, no access
    if (!finalOrgSlug) return { entitlement: null }

    const entitlement = entitlementsData?.entitlements.find(
      (entitlement) => entitlement.feature.key === featureKey
    )

    return {
      entitlement: entitlement ?? null,
    }
  }, [entitlementsData, featureKey, finalOrgSlug])

  const isLoading = shouldGetSelectedOrg ? isLoadingSelectedOrg : isLoadingEntitlements
  const isSuccess = shouldGetSelectedOrg
    ? isSuccessSelectedOrg && isSuccessEntitlements
    : isSuccessEntitlements

  return {
    hasAccess: entitlement?.hasAccess ?? false,
    isLoading,
    isSuccess,
    getEntitlementNumericValue: () => getEntitlementNumericValue(entitlement),
    isEntitlementUnlimited: () => isEntitlementUnlimited(entitlement),
    getEntitlementSetValues: () => getEntitlementSetValues(entitlement),
  }
}
