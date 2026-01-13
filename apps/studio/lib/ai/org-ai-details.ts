import { getOrganizations } from 'data/organizations/organizations-query'
import { getProjectDetail } from 'data/projects/project-detail-query'
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

  const [organizations, selectedProject] = await Promise.all([
    getOrganizations({ headers }),
    getProjectDetail({ ref: projectRef }, undefined, headers),
  ])

  const selectedOrg = organizations.find((org) => org.slug === orgSlug)

  // If the project is not in the organization specific by the org slug, return an error
  if (selectedProject?.organization_id !== selectedOrg?.id) {
    throw new Error('Project and organization do not match')
  }

  const aiOptInLevel = getAiOptInLevel(selectedOrg?.opt_in_tags)
  const isLimited = selectedOrg?.plan.id === 'free'

  return {
    aiOptInLevel,
    isLimited,
  }
}
