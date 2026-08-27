import { subscriptionHasHipaaAddon } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { getProjectSettings } from '@/data/config/project-settings-v2-query'
import { checkEntitlement } from '@/data/entitlements/entitlements-query'
import { getOrganizations } from '@/data/organizations/organizations-query'
import { getProjectDetail } from '@/data/projects/project-detail-query'
import { getOrgSubscription } from '@/data/subscriptions/org-subscription-query'
import { getAiOptInLevel, type AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export type AIDetails = {
  aiOptInLevel: AiOptInLevel
  hasAccessToAdvanceModel: boolean
  hasHipaaAddon: boolean | undefined
  orgId: number | undefined
  planId: string | undefined
  region: string | undefined
  isSensitive: boolean | null | undefined
}

// Resolves the AI opt-in level, model access and tracing inputs for one org/project pair.
// Both identifiers come from the request body, so an unconfirmed pairing resolves to the
// most restrictive posture rather than the requested one.
export const getAIDetails = async ({
  orgSlug,
  projectRef,
  authorization,
}: {
  orgSlug: string
  projectRef: string
  authorization: string
}): Promise<AIDetails> => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authorization && { Authorization: authorization }),
  }

  const [organizations, subscription, advanceModelAccess, project, projectSettings] =
    await Promise.all([
      getOrganizations({ headers }),
      getOrgSubscription({ orgSlug }, undefined, headers),
      checkEntitlement(orgSlug, 'assistant.advance_model', undefined, headers),
      // skipWake: only organization_id and region are needed, neither requires a running project
      getProjectDetail({ ref: projectRef, skipWake: true }, undefined, headers),
      getProjectSettings({ projectRef }, undefined, headers),
    ])

  const selectedOrg = organizations.find((org) => org.slug === orgSlug)
  const region = project?.region
  const isSensitive = projectSettings?.is_sensitive

  const isProjectInOrg = selectedOrg !== undefined && project?.organization_id === selectedOrg.id

  if (!isProjectInOrg) {
    return {
      aiOptInLevel: 'disabled',
      hasAccessToAdvanceModel: false,
      // Undefined rather than false so isTracingAllowed fails closed
      hasHipaaAddon: undefined,
      orgId: undefined,
      planId: undefined,
      region,
      isSensitive,
    }
  }

  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  // Mirrors the client-side gate in useOrgAiOptInLevel, which had no server-side equivalent
  const isRestrictedByHipaa = hasHipaaAddon && isSensitive !== false

  return {
    aiOptInLevel: isRestrictedByHipaa ? 'disabled' : getAiOptInLevel(selectedOrg.opt_in_tags),
    hasAccessToAdvanceModel: advanceModelAccess.hasAccess,
    hasHipaaAddon,
    orgId: selectedOrg.id,
    planId: selectedOrg.plan.id,
    region,
    isSensitive,
  }
}
