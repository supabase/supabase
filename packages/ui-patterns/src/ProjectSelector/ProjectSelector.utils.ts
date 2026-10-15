export interface ProjectSelectorOrganization {
  slug: string
  name: string
}

export interface ProjectSelectorProject {
  ref: string
  name: string
  organizationSlug: string
  /** Optional status label rendered next to the project, e.g. "Paused" */
  status?: string
  /** Disabled projects are listed but can't be selected */
  disabled?: boolean
}

export interface ProjectSelectorGroup<P extends ProjectSelectorProject = ProjectSelectorProject> {
  organization: ProjectSelectorOrganization
  projects: P[]
}

// Project refs are 20 lowercase letters, e.g. "abcdefghijklmnopqrst"
const PROJECT_REF_REGEX = /^[a-z]{20}$/

export function isValidProjectRef(value: string) {
  return PROJECT_REF_REGEX.test(value)
}

/**
 * Groups projects under their organization, keeping the order of `organizations`.
 * Projects whose organization isn't in the list are grouped under their slug so
 * they're still reachable.
 */
export function groupProjectsByOrganization<P extends ProjectSelectorProject>(
  organizations: ProjectSelectorOrganization[],
  projects: P[]
): ProjectSelectorGroup<P>[] {
  const groups = new Map<string, ProjectSelectorGroup<P>>()

  for (const organization of organizations) {
    groups.set(organization.slug, { organization, projects: [] })
  }

  for (const project of projects) {
    const group = groups.get(project.organizationSlug)
    if (group) {
      group.projects.push(project)
    } else {
      groups.set(project.organizationSlug, {
        organization: { slug: project.organizationSlug, name: project.organizationSlug },
        projects: [project],
      })
    }
  }

  return [...groups.values()].filter((group) => group.projects.length > 0)
}

/**
 * Search keywords for a project so the list can be filtered by project name, project ref,
 * organization name or organization slug.
 */
export function getProjectSearchKeywords(
  project: ProjectSelectorProject,
  organization: ProjectSelectorOrganization
) {
  return [project.name, project.ref, organization.name, organization.slug]
}
