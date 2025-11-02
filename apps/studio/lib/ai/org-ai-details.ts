import { getOrganizations } from 'data/organizations/organizations-query'
import { getProjects } from 'data/projects/projects-query'
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
  const [organizations, projects] = await Promise.all([
    getOrganizations({
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { Authorization: authorization }),
      },
    }),
    getProjects({
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { Authorization: authorization }),
      },
    }),
  ])

  const selectedOrg = organizations.find((org) => org.slug === orgSlug)
  const selectedProject = projects.find(
    (project) => project.ref === projectRef || project.preview_branch_refs.includes(projectRef)
  )

  // If the project is not in the organization specific by the org slug, return an error
  if (selectedProject?.organization_slug !== selectedOrg?.slug) {
    throw new Error('Project and organization do not match')
  }

  const aiOptInLevel = getAiOptInLevel(selectedOrg?.opt_in_tags)
  const isLimited = selectedOrg?.plan.id === 'free'

  return {
    aiOptInLevel,
    isLimited,
  }
}
