import { PermissionAction } from '@supabase/shared-types/out/constants'
import { MoreVertical, Redo2, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useOrganizationCreateInvitationMutation } from 'data/organization-members/organization-invitation-create-mutation'
import { useOrganizationDeleteInvitationMutation } from 'data/organization-members/organization-invitation-delete-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import {
  useOrganizationMembersQuery,
  type OrganizationMember,
} from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { LeaveTeamButton } from './LeaveTeamButton'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { UpdateRolesPanel } from './UpdateRolesPanel/UpdateRolesPanel'

interface MemberActionsProps {
  member: OrganizationMember
}

export const MemberActions = ({ member }: MemberActionsProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const organizationMembersDeletionEnabled = useIsFeatureEnabled('organization_members:delete')

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: permissions } = usePermissionsQuery()
  const { data: allRoles } = useOrganizationRolesV2Query({ slug })
  const { data: members } = useOrganizationMembersQuery({ slug })

  const memberIsUser = member.gotrue_id == profile?.gotrue_id
  const orgScopedRoles = allRoles?.org_scoped_roles ?? []
  const projectScopedRoles = allRoles?.project_scoped_roles ?? []
  const isPendingInviteAcceptance = !!member.invited_id

  const userMemberData = members?.find((m) => m.gotrue_id === profile?.gotrue_id)
  const hasOrgRole =
    (userMemberData?.role_ids ?? []).length === 1 &&
    orgScopedRoles.some((r) => r.id === userMemberData?.role_ids[0])

  const { rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.slug,
    orgScopedRoles.concat(projectScopedRoles),
    permissions ?? []
  )

  const roleId = member.role_ids?.[0] ?? -1
  const canRemoveMember = member.role_ids.every((id) => rolesRemovable.includes(id))

  const { can: canCreateUserInvites } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_invites',
    { resource: { role_id: roleId } }
  )
  const canResendInvite = canCreateUserInvites && hasOrgRole

  const { can: canDeleteUserInvites } = useAsyncCheckPermissions(
    PermissionAction.DELETE,
    'user_invites',
    { resource: { role_id: roleId } }
  )
  const canRevokeInvite = canDeleteUserInvites && hasOrgRole

  const { mutate: deleteOrganizationMember, isPending: isDeletingMember } =
    useOrganizationMemberDeleteMutation({
      onSuccess: () => {
        toast.success(`Successfully removed ${member.primary_email}`)
        setIsDeleteModalOpen(false)
      },
    })

  const { mutate: inviteMember, isPending: isCreatingInvite } =
    useOrganizationCreateInvitationMutation({
      onSuccess: () => {
        toast.success('Resent the invitation.')
      },
      onError: (error) => {
        toast.error(`Failed to resend invitation: ${error.message}`)
      },
    })

  const { mutate: deleteInvitation, isPending: isDeletingInvite } =
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
            const projects = projectScopedRole.projects.map(({ ref }) => ref)
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
      { onSuccess: () => toast.success('Successfully revoked the invitation.') }
    )
  }

  if (memberIsUser) {
    return (
      <div className="flex items-center justify-end">
        <LeaveTeamButton />
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
          <DropdownMenuContent side="bottom" align="end" className="w-40">
            <>
              {isPendingInviteAcceptance ? (
                <>
                  <DropdownMenuItemTooltip
                    className="gap-x-2"
                    disabled={!canResendInvite}
                    onClick={() => handleResendInvite(member)}
                    tooltip={{
                      content: {
                        side: 'left',
                        text: 'Additional permissions required to resend invitation',
                      },
                    }}
                  >
                    <Redo2 size={14} />
                    <p>Resend invitation</p>
                  </DropdownMenuItemTooltip>

                  <DropdownMenuSeparator />

                  <DropdownMenuItemTooltip
                    className="gap-x-2"
                    disabled={!canRevokeInvite}
                    onClick={() => handleRevokeInvitation(member)}
                    tooltip={{
                      content: {
                        side: 'left',
                        text: 'Additional permissions required to cancel invitation',
                      },
                    }}
                  >
                    <Trash size={14} />
                    <p>Cancel invitation</p>
                  </DropdownMenuItemTooltip>
                </>
              ) : (
                organizationMembersDeletionEnabled && (
                  <DropdownMenuItemTooltip
                    className="gap-x-2"
                    disabled={!canRemoveMember}
                    onClick={() => setIsDeleteModalOpen(true)}
                    tooltip={{
                      content: {
                        side: 'left',
                        text: 'Additional permissions required to remove member',
                      },
                    }}
                  >
                    <Trash size={12} />
                    <p>Remove member</p>
                  </DropdownMenuItemTooltip>
                )
              )}
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmationModal
        size="large"
        visible={isDeleteModalOpen}
        loading={isDeletingMember}
        title="Confirm to remove member"
        confirmLabel="Remove"
        variant="warning"
        alert={{
          title: 'All user content from this member will be permanently removed.',
          description: (
            <div>
              Removing a member will delete all of the user's saved content in all projects of this
              organization, which includes:
              <ul className="list-disc pl-4 my-2">
                <li>
                  SQL snippets{' '}
                  <span className="text-foreground">
                    (both <span className="underline">private</span> and{' '}
                    <span className="underline">shared</span> snippets)
                  </span>
                </li>
                <li>Custom reports</li>
                <li>Log Explorer queries</li>
              </ul>
              <p className="mt-4 text-foreground-lighter">
                If you'd like to retain the member's shared SQL snippets, right click on them and
                "Duplicate query" in the SQL Editor before removing this member.
              </p>
            </div>
          ),
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleMemberDelete()
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to remove{' '}
          <span className="text-foreground">{member.primary_email}</span> from{' '}
          <span className="text-foreground">{selectedOrganization?.name}</span>?
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
