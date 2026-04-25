import { subscriptionHasHipaaAddon } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { getProjectSettings } from '@/data/config/project-settings-v2-query'
import { checkEntitlement } from '@/data/entitlements/entitlements-query'
import { get } from '@/data/fetchers'
import { getOrganizations } from '@/data/organizations/organizations-query'
import { getProjectDetail } from '@/data/projects/project-detail-query'
import { getOrgSubscription } from '@/data/subscriptions/org-subscription-query'
import { getAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export const getOrgAIDetails = async ({
  orgSlug,
  authorization,
}: {
  orgSlug: string
  authorization: string
}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authorization && { Authorization: authorization }),
  }

  const [organizations, subscription, advanceModelAccess, dpaSignedStatus] = await Promise.all([
    getOrganizations({ headers }),
    getOrgSubscription({ orgSlug }, undefined, headers),
    checkEntitlement(orgSlug, 'assistant.advance_model', undefined, headers),
    get('/platform/organizations/{slug}/documents/dpa-signed', {
      params: { path: { slug: orgSlug } },
      headers,
    }),
  ])

  const selectedOrg = organizations.find((org) => org.slug === orgSlug)

  return {
    aiOptInLevel: getAiOptInLevel(selectedOrg?.opt_in_tags),
    hasAccessToAdvanceModel: advanceModelAccess.hasAccess,
    hasHipaaAddon: subscriptionHasHipaaAddon(subscription),
    isDpaSigned: dpaSignedStatus.data?.signed,
    orgId: selectedOrg?.id,
    planId: selectedOrg?.plan.id,
  }
}

export const getProjectAIDetails = async ({
  projectRef,
  authorization,
}: {
  projectRef: string
  authorization: string
}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authorization && { Authorization: authorization }),
  }

  const [selectedProject, projectSettings] = await Promise.all([
    getProjectDetail({ ref: projectRef }, undefined, headers),
    getProjectSettings({ projectRef }, undefined, headers),
  ])

  return {
    region: selectedProject?.region,
    isSensitive: projectSettings?.is_sensitive,
  }
}
