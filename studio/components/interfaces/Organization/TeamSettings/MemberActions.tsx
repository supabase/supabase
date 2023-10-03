import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common/hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { useOrganizationMemberInviteDeleteMutation } from 'data/organizations/organization-member-invite-delete-mutation'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { Member, Role } from 'types'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconMoreHorizontal,
  IconTrash,
} from 'ui'
import { isInviteExpired } from '../Organization.utils'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

interface MemberActionsProps {
  member: Member
  roles: Role[]
}

const MemberActions = ({ member, roles }: MemberActionsProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const { data: permissions } = usePermissionsQuery()
  const { rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
    roles,
    permissions ?? []
  )

  const isExpired = isInviteExpired(member?.invited_at ?? '')
  const isPendingInviteAcceptance = member.invited_id

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
        ui.setNotification({
          category: 'success',
          message: `Successfully removed ${member.primary_email}`,
        })
      },
    })

  const { mutate: createOrganizationMemberInvite, isLoading: isCreatingInvite } =
    useOrganizationMemberInviteCreateMutation({
      onSuccess: () => {
        ui.setNotification({ category: 'success', message: 'Resent the invitation.' })
      },
      onError: (error) => {
        ui.setNotification({
          category: 'error',
          message: `Failed to resend invitation: ${error.message}`,
        })
      },
    })

  const { mutateAsync: asyncDeleteMemberInvite, isLoading: isDeletingInvite } =
    useOrganizationMemberInviteDeleteMutation()

  const handleMemberDelete = async () => {
    confirmAlert({
      title: 'Confirm to remove',
      message: `This is permanent! Are you sure you want to remove ${member.primary_email}`,
      onAsyncConfirm: async () => {
        if (!slug) return console.error('slug is required')
        if (!member.gotrue_id) return console.error('gotrue_id is required')
        deleteOrganizationMember({ slug, gotrueId: member.gotrue_id })
      },
    })
  }

  const handleResendInvite = async (member: Member) => {
    const roleId = (member?.role_ids ?? [])[0]
    const invitedId = member.invited_id

    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    await asyncDeleteMemberInvite({ slug, invitedId, invalidateDetail: false })
    createOrganizationMemberInvite({
      slug,
      invitedEmail: member.primary_email,
      ownerId: invitedId,
      roleId: roleId,
    })
  }

  const handleRevokeInvitation = async (member: Member) => {
    const invitedId = member.invited_id
    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    await asyncDeleteMemberInvite({ slug, invitedId })
    ui.setNotification({
      category: 'success',
      message: 'Successfully revoked the invitation.',
    })
  }

  if (!canRemoveMember || (isPendingInviteAcceptance && !canResendInvite && !canRevokeInvite)) {
    return (
      <div className="flex items-center justify-end">
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button type="text" icon={<IconMoreHorizontal />} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                  'border border-scale-200 ', //border
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  You need additional permissions to manage this team member
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    )
  }

  const isLoading = isDeletingMember || isDeletingInvite || isCreatingInvite

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu_Shadcn_>
        <DropdownMenuTrigger_Shadcn_>
          <Button
            asChild
            type="text"
            disabled={isLoading}
            loading={isLoading}
            icon={<IconMoreHorizontal />}
          >
            <span></span>
          </Button>
        </DropdownMenuTrigger_Shadcn_>
        <DropdownMenuContent_Shadcn_ side="bottom" align="end">
          <>
            {isPendingInviteAcceptance ? (
              <>
                {canRevokeInvite && (
                  <DropdownMenuItem_Shadcn_ onClick={() => handleRevokeInvitation(member)}>
                    <div className="flex flex-col">
                      <p>Cancel invitation</p>
                      <p className="block opacity-50">Revoke this invitation.</p>
                    </div>
                  </DropdownMenuItem_Shadcn_>
                )}
                {/* canResendInvite && isExpired */}
                {true && (
                  <>
                    <DropdownMenuSeparator_Shadcn_ />
                    <DropdownMenuItem_Shadcn_ onClick={() => handleResendInvite(member)}>
                      <div className="flex flex-col">
                        <p>Resend invitation</p>
                        <p className="block opacity-50">Invites expire after 24hrs.</p>
                      </div>
                    </DropdownMenuItem_Shadcn_>
                  </>
                )}
              </>
            ) : (
              <DropdownMenuItem_Shadcn_ className="space-x-2" onClick={handleMemberDelete}>
                <IconTrash size={16} />
                <p>Remove member</p>
              </DropdownMenuItem_Shadcn_>
            )}
          </>
        </DropdownMenuContent_Shadcn_>
      </DropdownMenu_Shadcn_>
    </div>
  )
}

export default observer(MemberActions)
