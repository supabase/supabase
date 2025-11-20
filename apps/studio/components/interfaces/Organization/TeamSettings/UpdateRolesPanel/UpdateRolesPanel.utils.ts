import { groupBy, isEqual } from 'lodash'

import {
  OrganizationRole,
  OrganizationRolesResponse,
} from 'data/organization-members/organization-roles-query'
import { OrganizationMember } from 'data/organizations/organization-members-query'

export interface ProjectRoleConfiguration {
  ref?: string
  name?: string
  roleId: number
  baseRoleId?: number
}

export const formatMemberRoleToProjectRoleConfiguration = (
  member: OrganizationMember,
  allRoles: OrganizationRolesResponse
) => {
  const { org_scoped_roles, project_scoped_roles } = allRoles

  const roleConfiguration = member.role_ids
    .map((id) => {
      const orgRole = org_scoped_roles.find((role) => role.id === id)
      if (orgRole !== undefined) {
        return { ref: undefined, name: undefined, roleId: orgRole.id }
      }

      const projectRole = project_scoped_roles.find((role) => role.id === id)
      if (projectRole !== undefined) {
        return projectRole.projects.map((x) => ({
          ref: x.ref,
          name: x.name,
          roleId: projectRole.id,
          baseRoleId: projectRole.base_role_id,
        }))
      }

      return undefined
    })
    .filter(Boolean)
    .flat()
    .filter((p) => {
      // [Joshen] Validate only for project scoped roles
      // This filters out project scoped roles for projects that the user doesn't have access to
      // (e.g if the project was deleted)
      if ('baseRoleId' in p!) {
        return p.ref !== undefined
      } else {
        return p
      }
    })
    .sort((a, b) => (a?.name ?? '').localeCompare(b?.name ?? '')) as ProjectRoleConfiguration[]

  return roleConfiguration
}

export const deriveChanges = (
  original: ProjectRoleConfiguration[] = [],
  final: ProjectRoleConfiguration[] = []
) => {
  const removed: ProjectRoleConfiguration[] = []
  const added: ProjectRoleConfiguration[] = []
  const updated: {
    ref?: string
    name?: string
    originalRole: number
    originalBaseRole?: number
    updatedRole: number
  }[] = []

  original.forEach((x) => {
    const updatedRoleForProject = final.find((y) => x.ref === y.ref)
    if (updatedRoleForProject === undefined) {
      removed.push(x)
    } else if (updatedRoleForProject.roleId !== x.roleId) {
      updated.push({
        ref: updatedRoleForProject.ref,
        name: updatedRoleForProject.name,
        originalRole: x.roleId,
        originalBaseRole: x.baseRoleId,
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

// [Joshen] Essentially spit out 3 arrays
// What to (1) Remove (2) Assign (3) Update
// And so that we can unit test this
export const deriveRoleChangeActions = (
  existingRoles: OrganizationRole[],
  changesToRoles: {
    removed: ProjectRoleConfiguration[]
    added: ProjectRoleConfiguration[]
    updated: {
      ref?: string
      name?: string
      originalRole: number
      originalBaseRole?: number
      updatedRole: number
    }[]
  }
) => {
  const { removed, added, updated } = changesToRoles
  const toRemove: number[] = []
  const toAssign: { roleId: number; refs: string[] }[] = []
  const toUpdate: { roleId: number; refs: string[] }[] = []

  const groupByAddedRoles = groupBy(added, 'roleId')
  const groupByRemovedRoles = groupBy(removed, 'roleId')
  const groupByUpdatingFromRoles = groupBy(updated, 'originalRole')
  const groupByUpdatingToRoles = groupBy(updated, 'updatedRole')
  const existingProjectRolesByBaseIds = existingRoles
    .filter((r) => (r?.projects ?? []).length > 0)
    .map((r) => r.base_role_id)

  existingRoles.forEach((role) => {
    const projectRefsApplied = role.projects.map((x) => x.ref)
    if (projectRefsApplied.length === 0) {
      // [Joshen] In this case we're removing an org scope role, skip all the chekcs
      return toRemove.push(role.id)
    }

    const toRemoveRole = projectRefsApplied.every((ref) => {
      const isRemoved = removed.map((r) => r.ref).some((x) => x === ref)
      const isUpdated = updated.map((r) => r.ref).some((x) => x === ref)
      return isRemoved || isUpdated
    })
    const isRoleGettingAdded = added.some((r) => r.roleId === role.base_role_id)
    const isRoleGettingUpdatedTo = updated.some((r) => r.updatedRole === role.base_role_id)

    if (toRemoveRole && !isRoleGettingAdded && !isRoleGettingUpdatedTo) {
      return toRemove.push(role.id)
    }

    const projectsToAddToRole = (groupByAddedRoles[role.base_role_id]?.map((r) => r.ref) ??
      []) as string[]
    const projectsToRemoveFromRole = (groupByRemovedRoles[role.id]?.map((r) => r.ref) ??
      []) as string[]
    const projectsUpdatingFromRole = (groupByUpdatingFromRoles[role.id]?.map((r) => r.ref) ??
      []) as string[]
    const projectsUpdatingToRole = (groupByUpdatingToRoles[role.base_role_id]?.map((r) => r.ref) ??
      []) as string[]
    const projectRefsAppliedUpdated = projectRefsApplied
      .filter((x) => !projectsToRemoveFromRole.includes(x))
      .filter((x) => !projectsUpdatingFromRole.includes(x))
      .concat(projectsToAddToRole)
      .concat(projectsUpdatingToRole)

    if (!isEqual(projectRefsApplied, projectRefsAppliedUpdated)) {
      toUpdate.push({ roleId: role.id, refs: projectRefsAppliedUpdated })
    }
  })

  Object.keys(groupByAddedRoles).forEach((roleId) => {
    if (!existingProjectRolesByBaseIds.includes(Number(roleId))) {
      toAssign.push({
        roleId: Number(roleId),
        refs: groupByAddedRoles[roleId].map((x) => x.ref).filter((x) => x !== undefined),
      })
    }
  })

  Object.keys(groupByUpdatingToRoles).forEach((roleId) => {
    if (!existingProjectRolesByBaseIds.includes(Number(roleId))) {
      toAssign.push({
        roleId: Number(roleId),
        refs: groupByUpdatingToRoles[roleId].map((x) => x.ref).filter((x) => x !== undefined),
      })
    }
  })

  // [Joshen] Am sorting the results just so its more deterministic when writing tests
  return {
    toRemove: toRemove.sort((a, b) => a - b),
    toAssign: toAssign.map((x) => ({ ...x, refs: x.refs.sort((a, b) => a.localeCompare(b)) })),
    toUpdate: toUpdate.map((x) => ({ ...x, refs: x.refs.sort((a, b) => a.localeCompare(b)) })),
  }
}
