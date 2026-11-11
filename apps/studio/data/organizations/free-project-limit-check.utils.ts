import type { MemberWithFreeProjectLimit } from '@/data/organizations/free-project-limit-check-query'

export type AffectedOrganization = {
  /** Stable key for lists; falls back to the name when the slug is hidden */
  key: string
  /** Null when the current user has no access to the organization */
  slug: string | null
  name: string
  projects: { key: string; ref: string | null; name: string }[]
  members: { key: string; label: string; email: string; limit: number }[]
}

/**
 * Inverts the per-member response into one entry per organization, so each
 * organization (and each project within it) is only listed once.
 */
export const groupByOrganization = (
  members: MemberWithFreeProjectLimit[]
): AffectedOrganization[] => {
  const orgs = new Map<string, AffectedOrganization>()

  for (const member of members) {
    for (const org of member.free_plan_organizations) {
      const orgKey = org.slug ?? `name:${org.organization_name}`
      let entry = orgs.get(orgKey)
      if (!entry) {
        entry = {
          key: orgKey,
          slug: org.slug,
          name: org.organization_name,
          projects: [],
          members: [],
        }
        orgs.set(orgKey, entry)
      }

      for (const project of org.projects) {
        const projectKey = project.ref ?? `name:${project.name}`
        if (!entry.projects.some((p) => p.key === projectKey)) {
          entry.projects.push({ key: projectKey, ref: project.ref, name: project.name })
        }
      }

      if (!entry.members.some((m) => m.key === member.primary_email)) {
        entry.members.push({
          key: member.primary_email,
          label: member.username || member.primary_email,
          email: member.primary_email,
          limit: member.free_project_limit,
        })
      }
    }
  }

  return [...orgs.values()]
}
