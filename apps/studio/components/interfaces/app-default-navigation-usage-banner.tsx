import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import { useMemo } from 'react'
import { Badge } from 'ui'

export function AppDefaultNavigationUsageBanner() {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()

  const { data: subscription } = useOrgSubscriptionQuery({
    orgSlug: selectedOrganization?.slug,
  })

  // We only want to query the org usage and check for possible over-ages for plans without usage billing enabled (free or pro with spend cap)
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: subscription?.usage_billing_enabled === false }
  )

  const exceedingLimits = useMemo(() => {
    if (orgUsage) {
      return getResourcesExceededLimitsOrg(orgUsage?.usages || []).length > 0
    } else {
      return false
    }
  }, [orgUsage])

  return exceedingLimits ? (
    <div className="ml-2">
      <Link href={`/org/${selectedOrganization?.slug}/usage`}>
        <Badge variant="destructive">Exceeding usage limits</Badge>
      </Link>
    </div>
  ) : null
}
