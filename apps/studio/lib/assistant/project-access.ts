import { subscriptionHasHipaaAddon } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { getProjectSettings } from '@/data/config/project-settings-v2-query'
import { checkEntitlement } from '@/data/entitlements/entitlements-query'
import { getOrganizations } from '@/data/organizations/organizations-query'
import { getProjectDetail } from '@/data/projects/project-detail-query'
import { getOrgSubscription } from '@/data/subscriptions/org-subscription-query'

/** Platform access constraints for the integration. Assistant consent is owned by its service. */
export async function getAssistantProjectAccess({
  projectRef,
  orgSlug,
  authorization,
}: {
  projectRef: string
  orgSlug: string
  authorization: string
}) {
  const headers = { 'Content-Type': 'application/json', Authorization: authorization }
  const [organizations, project, settings, subscription, entitlement] = await Promise.all([
    getOrganizations({ headers }),
    getProjectDetail({ ref: projectRef, skipWake: true }, undefined, headers),
    getProjectSettings({ projectRef }, undefined, headers),
    getOrgSubscription({ orgSlug }, undefined, headers),
    checkEntitlement(orgSlug, 'assistant.advance_model', undefined, headers),
  ])
  const organization = organizations.find((org) => org.slug === orgSlug)
  const hasProjectAccess =
    organization !== undefined && project?.organization_id === organization.id
  return {
    orgSlug: hasProjectAccess ? orgSlug : undefined,
    hasHipaaAddon:
      hasProjectAccess && subscription ? subscriptionHasHipaaAddon(subscription) : undefined,
    isSensitive: settings?.is_sensitive,
    hasAccessToAdvanceModel: hasProjectAccess && entitlement.hasAccess,
  }
}
