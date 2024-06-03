import * as Tooltip from '@radix-ui/react-tooltip'
import Image from 'next/legacy/image'
import { Dispatch, SetStateAction, useState } from 'react'
import toast from 'react-hot-toast'

import Table from 'components/to-be-cleaned/Table'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks'
import { useProfile } from 'lib/profile'
import { Role } from 'types'
import { Badge, IconAlertCircle, IconCheck, IconLoader, IconUser, IconX, Listbox } from 'ui'
import { getUserDisplayName, isInviteExpired } from '../Organization.utils'
import MemberActions from './MemberActions'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

export interface SelectedMember extends OrganizationMember {
  oldRoleId: number
  newRoleId: number
}

interface MemberRowProps {
  member: OrganizationMember
  roles: Role[]
  isLoadingRoles?: boolean
  showMfaEnabledColumn?: boolean
  setUserRoleChangeModalVisible: Dispatch<SetStateAction<boolean>>
  setSelectedMember: Dispatch<SetStateAction<SelectedMember | undefined>>
}

const MemberRow = ({
  member,
  roles,
  isLoadingRoles = false,
  showMfaEnabledColumn = false,
  setUserRoleChangeModalVisible,
  setSelectedMember,
}: MemberRowProps) => {
  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()

  const { data: permissions } = usePermissionsQuery()

  const { rolesAddable, rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
    roles,
    permissions ?? []
  )

  const [memberRoleId] = member.role_ids ?? []
  const role = (roles || []).find((role) => role.id === memberRoleId)
  const memberIsUser = member.primary_email == profile?.primary_email
  const isInvitedUser = Boolean(member.invited_id)
  const canRemoveRole = rolesRemovable.includes(memberRoleId)
  const disableRoleEdit = !canRemoveRole || memberIsUser || isInvitedUser
  const isEmailUser = member.username === member.primary_email
  const isFlyUser = Boolean(member.primary_email?.endsWith('customer.fly.io'))

  const validateSelectedRoleToChange = (roleId: any) => {
    if (!role || role.id === roleId) return

    const selectedRole = (roles || []).find((role) => role.id === roleId)
    const canAddRole = rolesAddable.includes(selectedRole?.id ?? -1)

    if (!canAddRole) {
      return toast.error(
        `You do not have permission to update this team member to ${selectedRole!.name}`
      )
    }

    setUserRoleChangeModalVisible(true)
    setSelectedMember({ ...member, oldRoleId: role.id, newRoleId: roleId })
  }

  const [hasInvalidImg, setHasInvalidImg] = useState(false)

  return (
    <Table.tr>
      <Table.td>
        <div className="flex items-center space-x-4">
          <div>
            {isInvitedUser || isEmailUser || isFlyUser || hasInvalidImg ? (
              <div className="w-[40px] h-[40px] bg-surface-100 border border-overlay rounded-full text-foreground-lighter flex items-center justify-center">
                <IconUser strokeWidth={1.5} />
              </div>
            ) : (
              <Image
                alt={member.username}
                src={`https://github.com/${member.username}.png?size=80`}
                width="40"
                height="40"
                className="border rounded-full"
                onError={() => {
                  setHasInvalidImg(true)
                }}
              />
            )}
          </div>
          <div>
            <p className="text-foreground">{getUserDisplayName(member)}</p>
            {isInvitedUser === undefined && (
              <p className="text-foreground-light">{member.primary_email}</p>
            )}
          </div>
        </div>
      </Table.td>

      <Table.td>
        {isInvitedUser && member.invited_at && (
          <Badge variant={isInviteExpired(member.invited_at) ? 'destructive' : 'warning'}>
            {isInviteExpired(member.invited_at) ? 'Expired' : 'Invited'}
          </Badge>
        )}
      </Table.td>

      {showMfaEnabledColumn && (
        <Table.td>
          <div className="flex items-center justify-center">
            {member.mfa_enabled ? (
              <IconCheck className="text-brand" strokeWidth={2} />
            ) : (
              <IconX className="text-foreground-light" strokeWidth={1.5} />
            )}
          </div>
        </Table.td>
      )}

      <Table.td>
        {isLoadingRoles ? (
          <div className="w-[140px]">
            <IconLoader className="animate-spin" size={16} strokeWidth={1.5} />
          </div>
        ) : role !== undefined ? (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-[140px]" asChild>
              <div>
                <Listbox
                  className={disableRoleEdit ? 'pointer-events-none' : ''}
                  disabled={disableRoleEdit}
                  value={role.id}
                  onChange={validateSelectedRoleToChange}
                >
                  {roles.map((r: any) => (
                    <Listbox.Option
                      key={r.id}
                      value={r.id}
                      label={r.name}
                      disabled={disableRoleEdit}
                      className="w-36"
                    >
                      {r.name}
                    </Listbox.Option>
                  ))}
                </Listbox>
              </div>
            </Tooltip.Trigger>
            {isInvitedUser ? (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                      'border border-background', //border
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      Role can only be changed after the user has accepted the invite
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            ) : !memberIsUser && !canRemoveRole ? (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                      'border border-background', //border
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      You need additional permissions to manage this team member
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            ) : (
              <></>
            )}
          </Tooltip.Root>
        ) : (
          <div className="flex items-center space-x-2">
            <p className="text-sm text-foreground-light">Invalid role</p>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <IconAlertCircle size={16} strokeWidth={1.5} />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                      'border border-background', //border
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      This user has an invalid role, please reach out to us via support
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        )}
      </Table.td>
      <Table.td>{!memberIsUser && <MemberActions member={member} roles={roles} />}</Table.td>
    </Table.tr>
  )
}

export default MemberRow
