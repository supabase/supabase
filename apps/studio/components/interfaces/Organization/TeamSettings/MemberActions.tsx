import { PermissionAction } from '@supabase/shared-types/out/constants'
import { MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { useOrganizationMemberInviteDeleteMutation } from 'data/organizations/organization-member-invite-delete-mutation'
import type { OrganizationMember } from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useCheckPermissions, useIsFeatureEnabled, useSelectedOrganization } from 'hooks'
import type { Role } from 'types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { UpdateRolesPanel } from './UpdateRolesPanel/UpdateRolesPanel'

interface MemberActionsProps {
  member: OrganizationMember
  roles: Role[]
}

const MemberActions = ({ member, roles }: MemberActionsProps) => {
  const { slug } = useParams()
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const organizationMembersDeletionEnabled = useIsFeatureEnabled('organization_members:delete')

  const selectedOrganization = useSelectedOrganization()
  const { data: permissions } = usePermissionsQuery()
  const { rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
    roles,
    permissions ?? []
  )

  const isPendingInviteAcceptance = !!member.invited_id

  const roleId = member.role_ids?.[0] ?? -1
  const canRemoveMember = rolesRemovable.includes((member?.role_ids ?? [-1])[0])
  const canResendInvite = useCheckPermissions(PermissionAction.CREATE, 'user_invites', {
    resource: { role_id: roleId },
  })
  const canRevokeInvite = useCheckPermissions(PermissionAction.DELETE, 'user_invites', {
    resource: { role_id: roleId },
  })

  const { mutate: deleteOrganizationMember, isLoading: isDeletingMember } =
    useOrganizationMemberDeleteMutation({
      onSuccess: () => {
        toast.success(`Successfully removed ${member.primary_email}`)
        setIsDeleteModalOpen(false)
      },
    })

  const { mutate: createOrganizationMemberInvite, isLoading: isCreatingInvite } =
    useOrganizationMemberInviteCreateMutation({
      onSuccess: () => {
        toast.success('Resent the invitation.')
      },
      onError: (error) => {
        toast.error(`Failed to resend invitation: ${error.message}`)
      },
    })

  const { mutateAsync: asyncDeleteMemberInvite, isLoading: isDeletingInvite } =
    useOrganizationMemberInviteDeleteMutation()

  const handleMemberDelete = async () => {
    if (!slug) return console.error('slug is required')
    if (!member.gotrue_id) return console.error('gotrue_id is required')
    deleteOrganizationMember({ slug, gotrueId: member.gotrue_id })
  }

  const handleResendInvite = async (member: OrganizationMember) => {
    const roleId = (member?.role_ids ?? [])[0]
    const invitedId = member.invited_id

    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    await asyncDeleteMemberInvite({ slug, invitedId, invalidateDetail: false })
    createOrganizationMemberInvite({
      slug,
      invitedEmail: member.primary_email!,
      ownerId: invitedId,
      roleId: roleId,
    })
  }

  const handleRevokeInvitation = async (member: OrganizationMember) => {
    const invitedId = member.invited_id
    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    await asyncDeleteMemberInvite({ slug, invitedId })
    toast.success('Successfully revoked the invitation.')
  }

  if (!canRemoveMember || (isPendingInviteAcceptance && !canResendInvite && !canRevokeInvite)) {
    return (
      <div className="flex items-center justify-end">
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button type="text" icon={<MoreVertical size={18} />} />
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">
            You need additional permissions to manage this team member
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      </div>
    )
  }

  const isLoading = isDeletingMember || isDeletingInvite || isCreatingInvite

  return (
    <>
      <div className="flex items-center justify-end gap-x-2">
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              type="default"
              disabled={isPendingInviteAcceptance || !canRemoveMember}
              onClick={() => setShowAccessModal(true)}
            >
              Manage access
            </Button>
          </TooltipTrigger_Shadcn_>
          {!canRemoveMember && (
            <TooltipContent_Shadcn_ side="bottom">
              You need additional permissions to manage this team member
            </TooltipContent_Shadcn_>
          )}
          {isPendingInviteAcceptance && (
            <TooltipContent_Shadcn_ side="bottom">
              Role can only be changed after the user has accepted the invite
            </TooltipContent_Shadcn_>
          )}
        </Tooltip_Shadcn_>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" className="px-1" disabled={isLoading} loading={isLoading}>
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <>
              {isPendingInviteAcceptance ? (
                <>
                  {canRevokeInvite && (
                    <DropdownMenuItem onClick={() => handleRevokeInvitation(member)}>
                      <div className="flex flex-col">
                        <p>Cancel invitation</p>
                        <p className="block opacity-50">Revoke this invitation.</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {canResendInvite && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                        <div className="flex flex-col">
                          <p>Resend invitation</p>
                          <p className="block opacity-50">Invites expire after 24hrs.</p>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                organizationMembersDeletionEnabled && (
                  <DropdownMenuItem
                    className="space-x-2"
                    onClick={() => {
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <Trash size={16} />
                    <p>Remove member</p>
                  </DropdownMenuItem>
                )
              )}
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        header="Confirm to remove"
        buttonLabel="Remove"
        onSelectCancel={() => setIsDeleteModalOpen(false)}
        onSelectConfirm={() => {
          handleMemberDelete()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            This is permanent! Are you sure you want to remove {member.primary_email}
          </p>
        </Modal.Content>
      </ConfirmationModal>

      <UpdateRolesPanel
        visible={showAccessModal}
        member={member}
        onClose={() => setShowAccessModal(false)}
      />
    </>
  )
}

export default MemberActions
