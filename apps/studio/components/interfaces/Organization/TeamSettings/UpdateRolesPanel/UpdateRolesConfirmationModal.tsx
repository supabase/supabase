import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { organizationKeys } from 'data/organization-members/keys'
import { useOrganizationMemberUnassignRoleMutation } from 'data/organization-members/organization-member-unassign-role-mutation'
import { useOrganizationMemberUpdateRoleMutation } from 'data/organization-members/organization-member-update-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { organizationKeys as organizationKeysV1 } from 'data/organizations/keys'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  ProjectRoleConfiguration,
  deriveChanges,
  formatMemberRoleToProjectRoleConfiguration,
} from './UpdateRolesPanel.utils'

interface UpdateRolesConfirmationModal {
  visible: boolean
  member: OrganizationMember
  projectsRoleConfiguration: ProjectRoleConfiguration[]
  onClose: (success?: boolean) => void
}

export const UpdateRolesConfirmationModal = ({
  visible,
  member,
  projectsRoleConfiguration,
  onClose,
}: UpdateRolesConfirmationModal) => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const organization = useSelectedOrganization()
  const { data: projects } = useProjectsQuery()
  const { data: allRoles } = useOrganizationRolesV2Query({ slug: organization?.slug })

  // [Joshen] Separate saving state instead of using RQ due to several successive steps
  const [saving, setSaving] = useState(false)
  const { mutateAsync: updateRole } = useOrganizationMemberUpdateRoleMutation()
  const { mutateAsync: removeRole } = useOrganizationMemberUnassignRoleMutation({
    onError: () => {},
  })

  const availableRoles = allRoles?.org_scoped_roles ?? []
  const { org_scoped_roles, project_scoped_roles } = allRoles ?? {
    org_scoped_roles: [],
    project_scoped_roles: [],
  }
  const orgProjects = (projects ?? []).filter((p) => p.organization_id === organization?.id)
  const originalConfiguration =
    allRoles !== undefined ? formatMemberRoleToProjectRoleConfiguration(member, allRoles) : []
  const changesToRoles = deriveChanges(originalConfiguration, projectsRoleConfiguration)

  const onConfirmUpdateMemberRoles = async () => {
    if (slug === undefined) return console.error('Slug is required')

    setSaving(true)
    const gotrueId = member.gotrue_id
    const isOrgScope =
      projectsRoleConfiguration.length === 1 && projectsRoleConfiguration[0].ref === undefined

    // Early return if we're just updating org level roles
    // Everything else below is just project level role changes then
    if (isOrgScope) {
      try {
        await updateRole({
          slug,
          gotrueId,
          roleId: projectsRoleConfiguration[0].roleId,
        })
        toast.success(`Successfully updated role for ${member.username}`)
        onClose(true)
        return
      } catch (error: any) {
        setSaving(false)
        return toast.error(`Failed to update role: ${error.message}`)
      }
    }

    const { added, removed, updated } = changesToRoles

    // We'll first remove roles from added - when removing roles, ignore the ones that are org-scoped
    const roleIdsToRemove = removed
      .filter((role) => role.ref !== undefined)
      .map((role) => role.roleId)
    try {
      await Promise.all(roleIdsToRemove.map((roleId) => removeRole({ slug, gotrueId, roleId })))
    } catch (error: any) {
      setSaving(false)
      return toast.error(`Failed to update role: ${error.message}`)
    }

    // Then add roles from added
    const roleIdsToAdd = added.reduce((a, b) => {
      if (!a.includes(b.roleId)) return [...a, b.roleId]
      return a
    }, [] as number[])
    try {
      await Promise.all(
        roleIdsToAdd.map((roleId) =>
          updateRole({
            slug,
            gotrueId,
            roleId,
            projects: added.filter((p) => p.roleId === roleId).map((p) => p.ref) as string[],
          })
        )
      )
    } catch (error: any) {
      setSaving(false)
      return toast.error(`Failed to update role: ${error.message}`)
    }

    // Finally we handle updating of existing roles separately since this is a little more complex
    // The same role ID could be applied for multiple projects
    updated.forEach(async (role) => {
      const originalRoleMeta = project_scoped_roles.find((r) => r.id === role.originalRole)
      const projectsCurrentlyUsingRole = originalRoleMeta?.description
        .split(',')
        .map((x) => x.trim())
      const projectsToKeepRole = projectsCurrentlyUsingRole?.filter((x) => x !== role.ref) ?? []

      try {
        // First remove the role
        await removeRole({ slug, gotrueId, roleId: role.originalRole })
        // Then add the new role + the roles that were previously for the other projects
        await Promise.all([
          ...(role.ref !== undefined
            ? [
                updateRole({
                  slug,
                  gotrueId,
                  roleId: role.updatedRole,
                  projects: [role.ref],
                  skipInvalidation: true,
                }),
              ]
            : []),
          ...(originalRoleMeta?.base_role_id !== undefined && projectsToKeepRole.length > 0
            ? [
                updateRole({
                  slug,
                  gotrueId,
                  roleId: originalRoleMeta.base_role_id,
                  projects: projectsToKeepRole,
                  skipInvalidation: true,
                }),
              ]
            : []),
        ])

        await Promise.all([
          queryClient.invalidateQueries(organizationKeys.rolesV2(slug)),
          queryClient.invalidateQueries(organizationKeysV1.members(slug)),
        ])
      } catch (error: any) {
        setSaving(false)
        toast.error(`Failed to update role: ${error.message}`)
      }
    })

    toast.success(`Successfully updated role for ${member.username}`)
    onClose(true)
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      loading={saving}
      title="Confirm to change roles of member"
      confirmLabel="Update roles"
      confirmLabelLoading="Updating"
      onCancel={() => onClose()}
      onConfirm={onConfirmUpdateMemberRoles}
    >
      <div className="flex flex-col gap-y-3">
        <p className="text-sm text-foreground-light">
          You are making the following changes to the role of{' '}
          <span className="text-foreground">{member.username}</span> in the organization{' '}
          <span className="text-foreground">{organization?.name}</span>:
        </p>
        <div className="flex flex-col gap-y-2">
          {changesToRoles.removed.length !== 0 && (
            <div>
              <p className="text-sm">
                Removing {changesToRoles.removed.length} role
                {changesToRoles.removed.length > 1 ? 's' : ''} for user:
              </p>
              <ul className="list-disc pl-6">
                {changesToRoles.removed.map((x, i) => {
                  const role =
                    org_scoped_roles.find((y) => y.id === x.roleId) ??
                    project_scoped_roles.find((y) => y.id === x.roleId)
                  const project = orgProjects.find((y) => y.ref === x.ref)
                  const roleName = (role?.name ?? 'Unknown').split('_')[0]

                  return (
                    <li key={`update-${i}`} className="text-sm text-foreground-light">
                      <span className="text-foreground">{roleName}</span> on{' '}
                      <span className={project !== undefined ? 'text-foreground' : ''}>
                        {project?.name ?? 'organization'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {changesToRoles.added.length !== 0 && (
            <div>
              <p className="text-sm">
                Adding {changesToRoles.added.length} role
                {changesToRoles.added.length > 1 ? 's' : ''} for user:
              </p>
              <ul className="list-disc pl-6">
                {changesToRoles.added.map((x, i) => {
                  const role = availableRoles.find((y) => y.id === x.roleId)
                  const project = orgProjects.find((y) => y.ref === x.ref)
                  return (
                    <li key={`update-${i}`} className="text-sm text-foreground-light">
                      <span className="text-foreground">{role?.name}</span> on{' '}
                      <span className={project !== undefined ? 'text-foreground' : ''}>
                        {project?.name ?? 'organization'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {changesToRoles.updated.length !== 0 && (
            <div>
              <p className="text-sm">
                Updating {changesToRoles.updated.length} role
                {changesToRoles.updated.length > 1 ? 's' : ''} for user:
              </p>
              <ul className="list-disc pl-6">
                {changesToRoles.updated.map((x, i) => {
                  const originalRole =
                    org_scoped_roles.find((y) => y.id === x.originalRole) ??
                    project_scoped_roles.find((y) => y.id === x.originalRole)
                  const updatedRole = org_scoped_roles.find((y) => y.id === x.updatedRole)
                  const project = orgProjects.find((y) => y.ref === x.ref)
                  const originalRoleName = (originalRole?.name ?? 'Unknown').split('_')[0]

                  return (
                    <li key={`update-${i}`} className="text-sm text-foreground-light">
                      From <span className="text-foreground">{originalRoleName}</span> to{' '}
                      <span className="text-foreground">{updatedRole?.name}</span> on{' '}
                      <span className={project !== undefined ? 'text-foreground' : ''}>
                        {project?.name ?? 'organization'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <p className="text-sm text-foreground">
          By changing the role of this member their permissions will change.
        </p>
      </div>
    </ConfirmationModal>
  )
}
