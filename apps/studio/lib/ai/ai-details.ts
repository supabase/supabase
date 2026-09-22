import { checkEntitlement } from '@/data/entitlements/entitlements-query'
import { getOrganizations } from '@/data/organizations/organizations-query'
import { getProjectDetail } from '@/data/projects/project-detail-query'
import { getAiOptInLevel, type AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export type AIDetails = {
  aiOptInLevel: AiOptInLevel
  hasAccessToAdvanceModel: boolean
  orgId: number | undefined
  orgSlug: string | undefined
  planId: string | undefined
  region: string | undefined
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

  const [organizations, advanceModelAccess, project] = await Promise.all([
    getOrganizations({ headers }),
    checkEntitlement(orgSlug, 'assistant.advance_model', undefined, headers),
    // skipWake: only organization_id and region are needed, neither requires a running project
    getProjectDetail({ ref: projectRef, skipWake: true }, undefined, headers),
  ])

  const selectedOrg = organizations.find((org) => org.slug === orgSlug)
  const region = project?.region

  const isProjectInOrg = selectedOrg !== undefined && project?.organization_id === selectedOrg.id

  if (!isProjectInOrg) {
    return {
      aiOptInLevel: 'disabled',
      hasAccessToAdvanceModel: false,
      orgId: undefined,
      orgSlug: undefined,
      planId: undefined,
      // Undefined rather than the real region so isTracingAllowed fails closed
      region: undefined,
    }
  }

  return {
    aiOptInLevel: getAiOptInLevel(selectedOrg.opt_in_tags),
    hasAccessToAdvanceModel: advanceModelAccess.hasAccess,
    orgId: selectedOrg.id,
    orgSlug: selectedOrg.slug,
    planId: selectedOrg.plan.id,
    region,
  }
}
