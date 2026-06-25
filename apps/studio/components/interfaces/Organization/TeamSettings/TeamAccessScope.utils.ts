/** Sentinel value for org-wide project access (current and future projects). */
export const ALL_PROJECTS_ACCESS_SCOPE = '__all_projects__' as const

export const ALL_PROJECTS_ACCESS_SCOPE_LABEL = 'All projects'

/** Roles that must always apply organization-wide (not project-scoped). */
export const ORG_WIDE_ONLY_ROLE_NAMES = ['Owner', 'Administrator'] as const

export type TeamAccessScopeSelection = typeof ALL_PROJECTS_ACCESS_SCOPE | string[]

export function roleRequiresOrgWideAccess(roleName: string) {
  return (ORG_WIDE_ONLY_ROLE_NAMES as readonly string[]).includes(roleName)
}

export function isAllProjectsAccessScope(
  accessScope: TeamAccessScopeSelection
): accessScope is typeof ALL_PROJECTS_ACCESS_SCOPE {
  return accessScope === ALL_PROJECTS_ACCESS_SCOPE
}

export function getSelectedProjectRefs(accessScope: TeamAccessScopeSelection) {
  return isAllProjectsAccessScope(accessScope) ? [] : accessScope
}

export function buildProjectPayloadFromAccessScope(accessScope: TeamAccessScopeSelection) {
  if (isAllProjectsAccessScope(accessScope)) return {}
  if (accessScope.length === 0) {
    throw new Error('Select at least one project')
  }
  return { projects: accessScope }
}

export function getAccessScopeLabel(
  accessScope: TeamAccessScopeSelection,
  projects: Array<{ ref: string; name: string }>
) {
  if (isAllProjectsAccessScope(accessScope)) return ALL_PROJECTS_ACCESS_SCOPE_LABEL

  if (accessScope.length === 0) return 'Select projects'

  if (accessScope.length === 1) {
    return projects.find((project) => project.ref === accessScope[0])?.name ?? '1 project selected'
  }

  return `${accessScope.length} projects selected`
}

export function toggleProjectInAccessScope(
  accessScope: TeamAccessScopeSelection,
  projectRef: string
): TeamAccessScopeSelection {
  if (isAllProjectsAccessScope(accessScope)) {
    return [projectRef]
  }

  if (accessScope.includes(projectRef)) {
    return accessScope.filter((ref) => ref !== projectRef)
  }

  return [...accessScope, projectRef]
}

/** @deprecated Use buildProjectPayloadFromAccessScope instead */
export function buildProjectPayload(applyToOrg: boolean, projectRef: string) {
  if (applyToOrg) return {}
  if (!projectRef) {
    throw new Error('projectRef is required when applyToOrg is false')
  }
  return { projects: [projectRef] }
}
