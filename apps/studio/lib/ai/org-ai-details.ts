import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { checkEntitlement } from 'data/entitlements/entitlements-query'
import { get } from 'data/fetchers'
import { getOrganizations } from 'data/organizations/organizations-query'
import { getOrgSubscription } from 'data/subscriptions/org-subscription-query'
import { getAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'

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
    isDpaSigned: dpaSignedStatus.data?.signed ?? false,
    orgId: selectedOrg?.id,
    planId: selectedOrg?.plan.id,
  }
}
