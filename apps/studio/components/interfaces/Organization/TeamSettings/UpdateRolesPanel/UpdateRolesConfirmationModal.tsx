import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { organizationKeys } from 'data/organization-members/keys'
import { useOrganizationMemberAssignRoleMutation } from 'data/organization-members/organization-member-role-assign-mutation'
import { useOrganizationMemberUnassignRoleMutation } from 'data/organization-members/organization-member-role-unassign-mutation'
import { useOrganizationMemberUpdateRoleMutation } from 'data/organization-members/organization-member-role-update-mutation'
import {
  OrganizationRole,
  useOrganizationRolesV2Query,
} from 'data/organization-members/organization-roles-query'
import { organizationKeys as organizationKeysV1 } from 'data/organizations/keys'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  ProjectRoleConfiguration,
  deriveChanges,
  deriveRoleChangeActions,
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
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: allRoles } = useOrganizationRolesV2Query({ slug: organization?.slug })

  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const orgProjects =
    useMemo(() => projectsData?.pages.flatMap((page) => page.projects), [projectsData?.pages]) || []

  // [Joshen] Separate saving state instead of using RQ due to several successive steps
  const [saving, setSaving] = useState(false)
  const { mutateAsync: assignRole } = useOrganizationMemberAssignRoleMutation()
  const { mutateAsync: removeRole } = useOrganizationMemberUnassignRoleMutation({
    onError: () => {},
  })
  const { mutateAsync: updateRole } = useOrganizationMemberUpdateRoleMutation()

  const availableRoles = allRoles?.org_scoped_roles ?? []
  const { org_scoped_roles, project_scoped_roles } = allRoles ?? {
    org_scoped_roles: [],
    project_scoped_roles: [],
  }
  const originalConfiguration =
    allRoles !== undefined ? formatMemberRoleToProjectRoleConfiguration(member, allRoles) : []
  const changesToRoles = deriveChanges(originalConfiguration, projectsRoleConfiguration)

  const onConfirmUpdateMemberRoles = async () => {
    if (slug === undefined) return console.error('Slug is required')

    setSaving(true)
    const gotrueId = member.gotrue_id
    const existingRoles = member.role_ids
      .map((id) => {
        return [...org_scoped_roles, ...project_scoped_roles].find((r) => r.id === id)
      })
      .map((x) => {
        // [Joshen] This is merely a patch to handle a issue on the BE whereby for a project-scoped member,
        // if one of the projects that the member is deleted, the roles isn't cleaned up on the BE
        // Hence adding an FE patch here for dashboard to self-remediate by omitting any project IDs from the role
        // which no longer exists in the organization projects list.
        // Note that because orgProjects is paginated, this is not always guaranteed
        if ((x?.projects ?? []).length > 0) {
          return {
            ...x,
            projects: x?.projects.filter(({ ref }) => orgProjects.some((p) => p.ref === ref)) ?? [],
          }
        } else {
          return x
        }
      })
      .filter(Boolean) as OrganizationRole[]

    const isChangeWithinOrgScope =
      projectsRoleConfiguration.length === 1 && projectsRoleConfiguration[0].ref === undefined

    // Early return if we're just updating org level roles
    // Everything else below is just project level role changes then
    if (isChangeWithinOrgScope) {
      try {
        await assignRole({
          slug,
          gotrueId,
          roleId: projectsRoleConfiguration[0].roleId,
        })
        toast.success(`Successfully updated role for ${member.username}`)
        onClose(true)
      } catch (error: any) {
        toast.error(`Failed to update role: ${error.message}`)
      } finally {
        setSaving(false)
        return
      }
    }

    const { toRemove, toAssign, toUpdate } = deriveRoleChangeActions(existingRoles, changesToRoles)

    try {
      for (const { roleId, refs } of toAssign) {
        await assignRole({
          slug,
          gotrueId,
          roleId,
          projects: refs,
          skipInvalidation: true,
        })
      }
      for (const roleId of toRemove) {
        await removeRole({ slug, gotrueId, roleId, skipInvalidation: true })
      }
      for (const { roleId, refs } of toUpdate) {
        await updateRole({
          slug,
          gotrueId,
          roleId,
          roleName: project_scoped_roles.find((r) => r.id === roleId)?.name as string,
          projects: refs,
          skipInvalidation: true,
        })
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.rolesV2(slug) }),
        queryClient.invalidateQueries({ queryKey: organizationKeysV1.members(slug) }),
      ])
      toast.success(`Successfully updated role for ${member.username}`)
      onClose(true)
    } catch (error: any) {
      toast.error(`Failed to update role: ${error.message}`)
    } finally {
      setSaving(false)
      return
    }
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
                  const roleName = (role?.name ?? 'Unknown').split('_')[0]

                  return (
                    <li key={`update-${i}`} className="text-sm text-foreground-light">
                      <span className="text-foreground">{roleName}</span> on{' '}
                      <span className="text-foreground">{x?.name ?? 'organization'}</span>
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
                  return (
                    <li key={`update-${i}`} className="text-sm text-foreground-light">
                      <span className="text-foreground">{role?.name}</span> on{' '}
                      <span className="text-foreground">{x?.name ?? 'organization'}</span>
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
                  const originalRoleName = (originalRole?.name ?? 'Unknown').split('_')[0]

                  return (
                    <li key={`update-${i}`} className="text-sm text-foreground-light">
                      From <span className="text-foreground">{originalRoleName}</span> to{' '}
                      <span className="text-foreground">{updatedRole?.name ?? 'Unknown'}</span> on{' '}
                      <span className="text-foreground">{x?.name ?? 'organization'}</span>
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
