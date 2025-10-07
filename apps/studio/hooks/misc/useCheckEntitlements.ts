import { useEntitlementsQuery } from "data/entitlements/entitlements-query"
import { useMemo } from "react"


export function useCheckEntitlements(featureKey: string, organizationSlug: string) {
  const { data: allEntitlements, isLoading, isSuccess } = useEntitlementsQuery({ slug: organizationSlug })


  const { hasAccess, entitlementValue } =  useMemo((): { hasAccess: boolean, entitlementValue: number | null } => {

     const entitlement = allEntitlements?.find((entitlement) => entitlement.feature.key === featureKey)
     const entitlementValue = entitlement?.value ?? null

     if (!entitlement) return { hasAccess: false, entitlementValue: null }

     return { hasAccess: entitlement.hasAccess, entitlementValue }
    
  }, [allEntitlements, featureKey])
  

  return { hasAccess, entitlementValue, isLoading, isSuccess }
}