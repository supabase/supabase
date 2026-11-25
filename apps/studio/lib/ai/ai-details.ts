import { getProjectSettings } from '@/data/config/project-settings-v2-query'
import { getOrganizations } from '@/data/organizations/organizations-query'
import { getProjectDetail } from '@/data/projects/project-detail-query'
import { getAiOptInLevel, type AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export type AIDetails = {
  aiOptInLevel: AiOptInLevel
  orgId: number | undefined
  orgSlug: string | undefined
  planId: string | undefined
  projectRegion: string | undefined
  /** "High Compliance" in the dashboard, `is_sensitive` in the platform API. */
  isHighComplianceProject: boolean | undefined
}

// Resolves the AI opt-in level and tracing inputs for one org/project pair.
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

  const [organizations, project, projectSettings] = await Promise.all([
    getOrganizations({ headers }),
    // Organization membership can be checked without waking the project.
    getProjectDetail({ ref: projectRef, skipWake: true }, undefined, headers),
    getProjectSettings({ projectRef }, undefined, headers),
  ])

  const selectedOrg = organizations.find((org) => org.slug === orgSlug)
  const isHighComplianceProject = projectSettings?.is_sensitive ?? undefined

  const isProjectInOrg = selectedOrg !== undefined && project?.organization_id === selectedOrg.id

  if (!isProjectInOrg) {
    return {
      aiOptInLevel: 'disabled',
      orgId: undefined,
      orgSlug: undefined,
      planId: undefined,
      projectRegion: undefined,
      isHighComplianceProject: undefined,
    }
  }

  return {
    aiOptInLevel: getAiOptInLevel(selectedOrg.opt_in_tags),
    orgId: selectedOrg.id,
    orgSlug: selectedOrg.slug,
    planId: selectedOrg.plan.id,
    projectRegion: project?.region,
    isHighComplianceProject,
  }
}
