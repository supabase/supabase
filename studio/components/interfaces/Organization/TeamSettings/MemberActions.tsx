import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { FC } from 'react'

import { useParams } from 'common/hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { useOrganizationMemberInviteDeleteMutation } from 'data/organizations/organization-member-invite-delete-mutation'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { Member, Role } from 'types'
import { Button, Dropdown, IconMoreHorizontal, IconTrash } from 'ui'
import { isInviteExpired } from '../Organization.utils'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

interface Props {
  member: Member
  roles: Role[]
}

const MemberActions: FC<Props> = ({ member, roles }) => {
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

  const {
    mutateAsync: deleteOrganizationMemberAsync,
    isLoading: isOrganizationMemberDeleteLoading,
  } = useOrganizationMemberDeleteMutation({
    onSuccess() {
      ui.setNotification({
        category: 'success',
        message: `Successfully removed ${member.primary_email}`,
      })
    },
    onError(error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete user: ${error.message}`,
      })
    },
  })

  const handleMemberDelete = async () => {
    confirmAlert({
      title: 'Confirm to remove',
      message: `This is permanent! Are you sure you want to remove ${member.primary_email}`,
      onAsyncConfirm: async () => {
        if (!slug) {
          throw new Error('slug is required')
        }
        if (!member.gotrue_id) {
          throw new Error('gotrue_id is required')
        }

        await deleteOrganizationMemberAsync({
          slug,
          gotrueId: member.gotrue_id,
        })
      },
    })
  }

  const {
    mutate: createOrganizationMemberInvite,
    isLoading: isOrganizationMemberInviteCreateLoading,
  } = useOrganizationMemberInviteCreateMutation({
    onSuccess() {
      ui.setNotification({ category: 'success', message: 'Resent the invitation.' })
    },
    onError(error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to resend invitation: ${error.message}`,
      })
    },
  })

  async function handleResendInvite(member: Member) {
    if (!member.invited_id || !slug) return

    const roleId = (member?.role_ids ?? [])[0]
    createOrganizationMemberInvite({
      slug,
      invitedEmail: member.primary_email,
      ownerId: member.invited_id,
      roleId: roleId,
    })
  }

  const {
    mutate: deleteOrganizationMemberInvite,
    isLoading: isOrganizationMemberInviteDeleteLoading,
  } = useOrganizationMemberInviteDeleteMutation({
    onSuccess() {
      ui.setNotification({ category: 'success', message: 'Successfully revoked the invitation.' })
    },
    onError(error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to revoke invitation: ${error.message}`,
      })
    },
  })

  function handleRevokeInvitation(member: Member) {
    const invitedId = member.invited_id
    if (!invitedId || !slug) return

    deleteOrganizationMemberInvite({
      slug,
      invitedId,
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
                <span className="text-xs text-scale-1200">
                  You need additional permissions to manage this team member
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    )
  }

  const isLoading =
    isOrganizationMemberDeleteLoading ||
    isOrganizationMemberInviteDeleteLoading ||
    isOrganizationMemberInviteCreateLoading

  return (
    <div className="flex items-center justify-end">
      <Dropdown
        side="bottom"
        align="end"
        size="small"
        overlay={
          <>
            {isPendingInviteAcceptance ? (
              <>
                {canRevokeInvite && (
                  <Dropdown.Item onClick={() => handleRevokeInvitation(member)}>
                    <div className="flex flex-col">
                      <p>Cancel invitation</p>
                      <p className="block opacity-50">Revoke this invitation.</p>
                    </div>
                  </Dropdown.Item>
                )}
                {canResendInvite && isExpired && (
                  <>
                    <Dropdown.Separator />
                    <Dropdown.Item onClick={() => handleResendInvite(member)}>
                      <div className="flex flex-col">
                        <p>Resend invitation</p>
                        <p className="block opacity-50">Invites expire after 24hrs.</p>
                      </div>
                    </Dropdown.Item>
                  </>
                )}
              </>
            ) : (
              <Dropdown.Item icon={<IconTrash size={16} />} onClick={handleMemberDelete}>
                <p>Remove member</p>
              </Dropdown.Item>
            )}
          </>
        }
      >
        <Button
          asChild
          type="text"
          disabled={isLoading}
          loading={isLoading}
          icon={<IconMoreHorizontal />}
        >
          <span></span>
        </Button>
      </Dropdown>
    </div>
  )
}

export default observer(MemberActions)
