import { PermissionAction } from '@supabase/shared-types/out/constants'
import { MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useOrganizationCreateInvitationMutation } from 'data/organization-members/organization-invitation-create-mutation'
import { useOrganizationDeleteInvitationMutation } from 'data/organization-members/organization-invitation-delete-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import {
  useOrganizationMembersQuery,
  type OrganizationMember,
} from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions, useIsFeatureEnabled, useSelectedOrganization } from 'hooks'
import { useProfile } from 'lib/profile'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { UpdateRolesPanel } from './UpdateRolesPanel/UpdateRolesPanel'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface MemberActionsProps {
  member: OrganizationMember
}

export const MemberActions = ({ member }: MemberActionsProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const organizationMembersDeletionEnabled = useIsFeatureEnabled('organization_members:delete')

  const selectedOrganization = useSelectedOrganization()
  const { data: permissions } = usePermissionsQuery()
  const { data: allProjects } = useProjectsQuery()
  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles } = useOrganizationRolesV2Query({ slug })

  const orgScopedRoles = allRoles?.org_scoped_roles ?? []
  const projectScopedRoles = allRoles?.project_scoped_roles ?? []
  const isPendingInviteAcceptance = !!member.invited_id

  const userMemberData = members?.find((m) => m.gotrue_id === profile?.gotrue_id)
  const hasOrgRole =
    (userMemberData?.role_ids ?? []).length === 1 &&
    orgScopedRoles.some((r) => r.id === userMemberData?.role_ids[0])

  const { rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
    orgScopedRoles.concat(projectScopedRoles),
    permissions ?? []
  )

  const roleId = member.role_ids?.[0] ?? -1
  const canRemoveMember = member.role_ids.every((id) => rolesRemovable.includes(id))
  const canResendInvite =
    useCheckPermissions(PermissionAction.CREATE, 'user_invites', {
      resource: { role_id: roleId },
    }) && hasOrgRole
  const canRevokeInvite =
    useCheckPermissions(PermissionAction.DELETE, 'user_invites', {
      resource: { role_id: roleId },
    }) && hasOrgRole

  const { mutate: deleteOrganizationMember, isLoading: isDeletingMember } =
    useOrganizationMemberDeleteMutation({
      onSuccess: () => {
        toast.success(`Successfully removed ${member.primary_email}`)
        setIsDeleteModalOpen(false)
      },
    })

  const { mutate: inviteMember, isLoading: isCreatingInvite } =
    useOrganizationCreateInvitationMutation({
      onSuccess: () => {
        toast.success('Resent the invitation.')
      },
      onError: (error) => {
        toast.error(`Failed to resend invitation: ${error.message}`)
      },
    })

  const { mutate: deleteInvitation, isLoading: isDeletingInvite } =
    useOrganizationDeleteInvitationMutation()

  const isLoading = isDeletingMember || isDeletingInvite || isCreatingInvite

  const handleMemberDelete = () => {
    if (!slug) return console.error('slug is required')
    if (!member.gotrue_id) return console.error('gotrue_id is required')
    deleteOrganizationMember({ slug, gotrueId: member.gotrue_id })
  }

  const handleResendInvite = (member: OrganizationMember) => {
    const roleId = (member?.role_ids ?? [])[0]
    const invitedId = member.invited_id

    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    deleteInvitation(
      { slug, id: invitedId, skipInvalidation: true },
      {
        onSuccess: () => {
          if (!member.primary_email) return toast.error('Email is required')
          const projectScopedRole = projectScopedRoles.find((role) => role.id === roleId)
          if (projectScopedRole !== undefined) {
            const projects = (projectScopedRole?.project_ids ?? [])
              .map((id) => allProjects?.find((p) => p.id === id)?.ref)
              .filter(Boolean) as string[]
            inviteMember({
              slug,
              email: member.primary_email,
              roleId: projectScopedRole.base_role_id,
              projects,
            })
          } else {
            inviteMember({ slug, email: member.primary_email, roleId })
          }
        },
      }
    )
  }

  const handleRevokeInvitation = (member: OrganizationMember) => {
    const invitedId = member.invited_id
    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    deleteInvitation(
      { slug, id: invitedId },
      {
        onSuccess: () => {
          toast.success('Successfully revoked the invitation.')
        },
      }
    )
  }

  if (!canRemoveMember || (isPendingInviteAcceptance && !canResendInvite && !canRevokeInvite)) {
    return (
      <div className="flex items-center justify-end">
        <ButtonTooltip
          disabled
          type="text"
          className="px-1.5"
          icon={<MoreVertical size={18} />}
          tooltip={{
            content: {
              side: 'bottom',
              text: 'You need additional permissions to manage this team member',
            },
          }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-end gap-x-2">
        <ButtonTooltip
          type="default"
          disabled={isPendingInviteAcceptance || !canRemoveMember}
          onClick={() => setShowAccessModal(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: isPendingInviteAcceptance
                ? 'Role can only be changed after the user has accepted the invite'
                : !canRemoveMember
                  ? 'You need additional permissions to manage this team member'
                  : undefined,
            },
          }}
        >
          Manage access
        </ButtonTooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              className="px-1.5"
              disabled={isLoading}
              loading={isLoading}
              icon={<MoreVertical />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <>
              {isPendingInviteAcceptance ? (
                <>
                  {canRevokeInvite && (
                    <DropdownMenuItem onClick={() => handleRevokeInvitation(member)}>
                      <div className="flex flex-col">
                        <p>Cancel invitation</p>
                        <p className="text-foreground-lighter">Revoke this invitation.</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {canResendInvite && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                        <div className="flex flex-col">
                          <p>Resend invitation</p>
                          <p className="text-foreground-lighter">Invites expire after 24hrs.</p>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                organizationMembersDeletionEnabled && (
                  <DropdownMenuItem
                    className="space-x-2 items-start"
                    disabled={!canRemoveMember}
                    onClick={() => {
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <Trash size={16} />
                    <div className="flex flex-col">
                      <p>Remove member</p>
                      {!canRemoveMember && (
                        <p className="text-foreground-lighter">Additional permissions required</p>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              )}
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        title="Confirm to remove"
        confirmLabel="Remove"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleMemberDelete()
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to remove {member.primary_email}
        </p>
      </ConfirmationModal>

      <UpdateRolesPanel
        visible={showAccessModal}
        member={member}
        onClose={() => setShowAccessModal(false)}
      />
    </>
  )
}
