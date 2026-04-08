import { useMemo } from 'react'

import { hasOrgUsageExceededLimits } from '@/components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgUsageQuery } from '@/data/usage/org-usage-query'

type SelectedOrgForUsageLimits =
  | {
      slug?: string
      usage_billing_enabled?: boolean | null
    }
  | null
  | undefined

/**
 * Loads org usage only when overage checks apply (e.g. free or Pro with spend cap —
 * `usage_billing_enabled === false`), then reports whether any capped metric exceeds free tier.
 */
export function useOrgUsageExceedingLimits(selectedOrganization: SelectedOrgForUsageLimits) {
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: selectedOrganization?.usage_billing_enabled === false }
  )

  const exceedingLimits = useMemo(() => hasOrgUsageExceededLimits(orgUsage), [orgUsage])

  return { exceedingLimits }
}
