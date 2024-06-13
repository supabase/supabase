import { OrganizationRolesResponse } from 'data/organization-members/organization-roles-query'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { ProjectInfo } from 'data/projects/projects-query'

export interface ProjectRoleConfiguration {
  ref?: string
  roleId: number
  baseRoleId?: number
}

export const formatMemberRoleToProjectRoleConfiguration = (
  member: OrganizationMember,
  allRoles: OrganizationRolesResponse,
  projects: ProjectInfo[]
) => {
  const { org_scoped_roles, project_scoped_roles } = allRoles

  const roleConfiguration = member.role_ids
    .map((id) => {
      const orgRole = org_scoped_roles.find((role) => role.id === id)
      if (orgRole !== undefined) {
        return { ref: undefined, roleId: orgRole.id }
      }
      const projectRole = project_scoped_roles.find((role) => role.id === id)
      if (projectRole !== undefined) {
        const projectRefs = projectRole.project_ids.map(
          (id) => projects.find((p) => p.id === id)?.ref
        )
        return projectRefs.map((ref) => ({
          ref,
          roleId: projectRole.id,
          baseRoleId: projectRole.base_role_id,
        }))
      }
    })
    .filter(Boolean)
    .flat() as ProjectRoleConfiguration[]

  return roleConfiguration
}

export const deriveChanges = (
  original: ProjectRoleConfiguration[] = [],
  final: ProjectRoleConfiguration[] = []
) => {
  const removed: ProjectRoleConfiguration[] = []
  const added: ProjectRoleConfiguration[] = []
  const updated: { ref?: string; originalRole: number; updatedRole: number }[] = []

  original.forEach((x) => {
    const updatedRoleForProject = final.find((y) => x.ref === y.ref)
    if (updatedRoleForProject === undefined) {
      removed.push(x)
    } else if (updatedRoleForProject.roleId !== x.roleId) {
      updated.push({
        ref: updatedRoleForProject.ref,
        originalRole: x.roleId,
        updatedRole: updatedRoleForProject.roleId,
      })
    }
  })

  final.forEach((x) => {
    const newRoleForProject = original.find((y) => x.ref === y.ref)
    if (newRoleForProject === undefined) {
      added.push(x)
    }
  })

  return { removed, added, updated }
}
