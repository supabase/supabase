import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { FC, useState } from 'react'
import { Button, Dropdown, IconMoreHorizontal, IconTrash } from 'ui'

import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { checkPermissions, useOrganizationDetail, useParams, useStore } from 'hooks'
import { delete_, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Member, Role } from 'types'

import { isInviteExpired } from '../Organization.utils'
import { getRolesManagementPermissions } from './TeamSettings.utils'

interface Props {
  members: Member[]
  member: Member
  roles: Role[]
}

const MemberActions: FC<Props> = ({ members, member, roles }) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { rolesRemovable } = getRolesManagementPermissions(roles)
  const { mutateOrgMembers } = useOrganizationDetail(slug || '')

  const [loading, setLoading] = useState(false)

  const isExpired = isInviteExpired(member?.invited_at ?? '')
  const isPendingInviteAcceptance = member.invited_id

  const roleId = member.role_ids?.[0] ?? -1
  const canRemoveMember = rolesRemovable.includes((member?.role_ids ?? [-1])[0])
  const canResendInvite = checkPermissions(PermissionAction.CREATE, 'user_invites', {
    resource: { role_id: roleId },
  })
  const canRevokeInvite = checkPermissions(PermissionAction.DELETE, 'user_invites', {
    resource: { role_id: roleId },
  })

  const handleMemberDelete = async () => {
    confirmAlert({
      title: 'Confirm to remove',
      message: `This is permanent! Are you sure you want to remove ${member.primary_email}`,
      onAsyncConfirm: async () => {
        setLoading(true)

        const response = await delete_(
          `${API_URL}/organizations/${slug}/members/${member.gotrue_id}`
        )

        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to delete user: ${response.error.message}`,
          })
          setLoading(false)
        } else {
          const updatedMembers = members.filter((m) => m.gotrue_id !== member.gotrue_id)

          mutateOrgMembers(updatedMembers)
          ui.setNotification({
            category: 'success',
            message: `Successfully removed ${member.primary_email}`,
          })
        }
      },
    })
  }

  async function handleResendInvite(member: Member) {
    setLoading(true)

    const roleId = (member?.role_ids ?? [])[0]
    const response = await post(`${API_URL}/organizations/${slug}/members/invite`, {
      invited_email: member.primary_email,
      owner_id: member.invited_id,
      role_id: roleId,
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to resend invitation: ${response.error.message}`,
      })
    } else {
      const updatedMembers = [...members]
      mutateOrgMembers(updatedMembers)
      ui.setNotification({ category: 'success', message: 'Resent the invitation.' })
    }
    setLoading(false)
  }

  async function handleRevokeInvitation(member: Member) {
    setLoading(true)

    const invitedId = member.invited_id
    if (!invitedId) return

    const response = await delete_(
      `${API_URL}/organizations/${slug}/members/invite?invited_id=${invitedId}`,
      {}
    )

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to revoke invitation: ${response.error.message}`,
      })
    } else {
      const updatedMembers = [...members]
      mutateOrgMembers(updatedMembers)
      ui.setNotification({ category: 'success', message: 'Successfully revoked the invitation.' })
    }
    setLoading(false)
  }

  if (!canRemoveMember || (isPendingInviteAcceptance && !canResendInvite && !canRevokeInvite)) {
    return (
      <div className="flex items-center justify-end">
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <Button as="span" type="text" icon={<IconMoreHorizontal />} />
          </Tooltip.Trigger>
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
        </Tooltip.Root>
      </div>
    )
  }

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
          as="span"
          type="text"
          disabled={loading}
          loading={loading}
          icon={<IconMoreHorizontal />}
        />
      </Dropdown>
    </div>
  )
}

export default observer(MemberActions)
