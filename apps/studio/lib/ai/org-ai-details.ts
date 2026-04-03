import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { getProjectSettings } from 'data/config/project-settings-v2-query'
import { checkEntitlement } from 'data/entitlements/entitlements-query'
import { get } from 'data/fetchers'
import { getOrganizations } from 'data/organizations/organizations-query'
import { getProjectDetail } from 'data/projects/project-detail-query'
import { getOrgSubscription } from 'data/subscriptions/org-subscription-query'
import { getAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'

export const getOrgAIDetails = async ({
  orgSlug,
  authorization,
  projectRef,
}: {
  orgSlug: string
  authorization: string
  projectRef: string
}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authorization && { Authorization: authorization }),
  }

  const [
    organizations,
    selectedProject,
    subscription,
    projectSettings,
    advanceModelAccess,
    dpaSignedStatus,
  ] = await Promise.all([
    getOrganizations({ headers }),
    getProjectDetail({ ref: projectRef }, undefined, headers),
    getOrgSubscription({ orgSlug }, undefined, headers),
    getProjectSettings({ projectRef }, undefined, headers),
    checkEntitlement(orgSlug, 'assistant.advance_model', undefined, headers),
    get('/platform/organizations/{slug}/documents/dpa-signed', {
      params: { path: { slug: orgSlug } },
      headers,
    }),
  ])

  const selectedOrg = organizations.find((org) => org.slug === orgSlug)

  // If the project is not in the organization specific by the org slug, return an error
  if (selectedProject?.organization_id !== selectedOrg?.id) {
    throw new Error('Project and organization do not match')
  }

  const aiOptInLevel = getAiOptInLevel(selectedOrg?.opt_in_tags)
  const hasAccessToAdvanceModel = advanceModelAccess.hasAccess
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)
  const isSensitive = projectSettings?.is_sensitive
  const isDpaSigned = dpaSignedStatus.data?.signed ?? false

  return {
    aiOptInLevel,
    hasAccessToAdvanceModel,
    hasHipaaAddon,
    isSensitive,
    isDpaSigned,
    region: selectedProject?.region,
    orgId: selectedOrg?.id,
    planId: selectedOrg?.plan.id,
  }
}
