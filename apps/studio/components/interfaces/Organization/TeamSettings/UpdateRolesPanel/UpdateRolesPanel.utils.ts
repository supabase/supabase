import { groupBy, isEqual } from 'lodash'

import {
  OrganizationRole,
  OrganizationRolesResponse,
} from 'data/organization-members/organization-roles-query'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { ProjectInfo } from 'data/projects/projects-query'

export interface ProjectRoleConfiguration {
  ref?: string
  projectId?: number
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
        const _projects = (projectRole?.project_ids ?? []).map((id) =>
          projects.find((p) => p.id === id)
        )
        return _projects.map((p) => ({
          ref: p?.ref,
          projectId: p?.id,
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
  final: ProjectRoleConfiguration[] = [],
  projects: ProjectInfo[]
) => {
  const removed: ProjectRoleConfiguration[] = []
  const added: ProjectRoleConfiguration[] = []
  const updated: {
    ref?: string
    projectId?: number
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

  return {
    removed: removed.map((r) => ({ ...r, projectId: projects.find((p) => p.ref === r.ref)?.id })),
    added: added.map((r) => ({ ...r, projectId: projects.find((p) => p.ref === r.ref)?.id })),
    updated: updated.map((r) => ({ ...r, projectId: projects.find((p) => p.ref === r.ref)?.id })),
  }
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
      projectId?: number
      originalRole: number
      originalBaseRole?: number
      updatedRole: number
    }[]
  }
) => {
  const { removed, added, updated } = changesToRoles
  const toRemove: number[] = []
  const toAssign: { roleId: number; projectIds: number[] }[] = []
  const toUpdate: { roleId: number; projectIds: number[] }[] = []

  const groupByAddedRoles = groupBy(added, 'roleId')
  const groupByRemovedRoles = groupBy(removed, 'roleId')
  const groupByUpdatingFromRoles = groupBy(updated, 'originalRole')
  const groupByUpdatingToRoles = groupBy(updated, 'updatedRole')
  const existingProjectRolesByBaseIds = existingRoles
    .filter((r) => (r?.project_ids ?? []).length > 0)
    .map((r) => r.base_role_id)

  existingRoles.forEach((role) => {
    const projectIdsApplied = role.project_ids
    if (projectIdsApplied === null) {
      // [Joshen] In this case we're removing an org scope role, skip all the chekcs
      return toRemove.push(role.id)
    }
    const toRemoveRole = projectIdsApplied.every((id) => {
      const isRemoved = removed.map((r) => r.projectId).some((x) => x === id)
      const isUpdated = updated.map((r) => r.projectId).some((x) => x === id)
      return isRemoved || isUpdated
    })
    const isRoleGettingAdded = added.some((r) => r.roleId === role.base_role_id)
    const isRoleGettingUpdatedTo = updated.some((r) => r.updatedRole === role.base_role_id)

    if (toRemoveRole && !isRoleGettingAdded && !isRoleGettingUpdatedTo) {
      return toRemove.push(role.id)
    }

    const projectsToAddToRole = (groupByAddedRoles[role.base_role_id]?.map((r) => r.projectId) ??
      []) as number[]
    const projectsToRemoveFromRole = (groupByRemovedRoles[role.id]?.map((r) => r.projectId) ??
      []) as number[]
    const projectsUpdatingFromRole = (groupByUpdatingFromRoles[role.id]?.map((r) => r.projectId) ??
      []) as number[]
    const projectsUpdatingToRole = (groupByUpdatingToRoles[role.base_role_id]?.map(
      (r) => r.projectId
    ) ?? []) as number[]
    const projectIdsAppliedUpdated = projectIdsApplied
      .filter((x) => !projectsToRemoveFromRole.includes(x))
      .filter((x) => !projectsUpdatingFromRole.includes(x))
      .concat(projectsToAddToRole)
      .concat(projectsUpdatingToRole)

    if (!isEqual(projectIdsApplied, projectIdsAppliedUpdated)) {
      toUpdate.push({ roleId: role.id, projectIds: projectIdsAppliedUpdated.sort((a, b) => a - b) })
    }
  })

  Object.keys(groupByAddedRoles).forEach((roleId) => {
    if (!existingProjectRolesByBaseIds.includes(Number(roleId))) {
      toAssign.push({
        roleId: Number(roleId),
        projectIds: (groupByAddedRoles[roleId].map((x) => x.projectId) as number[]).sort(
          (a, b) => a - b
        ),
      })
    }
  })

  Object.keys(groupByUpdatingToRoles).forEach((roleId) => {
    if (!existingProjectRolesByBaseIds.includes(Number(roleId))) {
      toAssign.push({
        roleId: Number(roleId),
        projectIds: (groupByUpdatingToRoles[roleId].map((x) => x.projectId) as number[]).sort(
          (a, b) => a - b
        ),
      })
    }
  })

  // [Joshen] Am sorting the results just so its more deterministic when writing tests
  return { toRemove: toRemove.sort((a, b) => a - b), toAssign, toUpdate }
}
