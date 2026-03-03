import type {
  Entitlement,
  EntitlementConfig,
  EntitlementType,
  FeatureKey,
} from 'data/entitlements/entitlements-query'
import { useEntitlementsQuery } from 'data/entitlements/entitlements-query'
import { IS_PLATFORM } from 'lib/constants'
import { useMemo } from 'react'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'

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

function getEntitlementMax(entitlement: Entitlement | null): number | undefined {
  return isEntitlementUnlimited(entitlement)
    ? Number.MAX_SAFE_INTEGER
    : getEntitlementNumericValue(entitlement)
}

export function useCheckEntitlements(
  featureKey: FeatureKey,
  organizationSlug?: string,
  options?: {
    enabled?: boolean
  }
) {
  // If no organizationSlug provided, try to get it from the selected organization
  const shouldGetSelectedOrg = !organizationSlug && options?.enabled !== false
  const {
    data: selectedOrg,
    isPending: isLoadingSelectedOrg,
    isSuccess: isSuccessSelectedOrg,
  } = useSelectedOrganizationQuery({
    enabled: shouldGetSelectedOrg,
  })

  const finalOrgSlug = organizationSlug || selectedOrg?.slug
  const enabled = IS_PLATFORM ? options?.enabled !== false && !!finalOrgSlug : false

  const {
    data: entitlementsData,
    isPending: isLoadingEntitlements,
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

  const isLoading = shouldGetSelectedOrg
    ? isLoadingSelectedOrg || isLoadingEntitlements
    : isLoadingEntitlements
  const isSuccess = shouldGetSelectedOrg
    ? isSuccessSelectedOrg && isSuccessEntitlements
    : isSuccessEntitlements

  return {
    hasAccess: IS_PLATFORM ? entitlement?.hasAccess ?? false : true,
    isLoading: IS_PLATFORM ? isLoading : false,
    isSuccess: IS_PLATFORM ? isSuccess : true,
    getEntitlementNumericValue: () => getEntitlementNumericValue(entitlement),
    isEntitlementUnlimited: () => isEntitlementUnlimited(entitlement),
    getEntitlementSetValues: () => getEntitlementSetValues(entitlement),
    getEntitlementMax: () => getEntitlementMax(entitlement),
  }
}
