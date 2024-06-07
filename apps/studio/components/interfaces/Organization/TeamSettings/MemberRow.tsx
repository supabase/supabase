import { Check, User, X } from 'lucide-react'
import Image from 'next/legacy/image'
import { Dispatch, SetStateAction, useState } from 'react'

import Table from 'components/to-be-cleaned/Table'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import { useProfile } from 'lib/profile'
import { Role } from 'types'
import { Badge, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
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
  setUserRoleChangeModalVisible: Dispatch<SetStateAction<boolean>>
  setSelectedMember: Dispatch<SetStateAction<SelectedMember | undefined>>
}

const MemberRow = ({
  member,
  roles,
  isLoadingRoles = false,
  setUserRoleChangeModalVisible,
  setSelectedMember,
}: MemberRowProps) => {
  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()

  const { data: projects } = useProjectsQuery()
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

  // const validateSelectedRoleToChange = (roleId: any) => {
  //   if (!role || role.id === roleId) return

  //   const selectedRole = (roles || []).find((role) => role.id === roleId)
  //   const canAddRole = rolesAddable.includes(selectedRole?.id ?? -1)

  //   if (!canAddRole) {
  //     return toast.error(
  //       `You do not have permission to update this team member to ${selectedRole!.name}`
  //     )
  //   }

  //   setUserRoleChangeModalVisible(true)
  //   setSelectedMember({ ...member, oldRoleId: role.id, newRoleId: roleId })
  // }

  const [hasInvalidImg, setHasInvalidImg] = useState(false)

  return (
    <Table.tr>
      <Table.td>
        <div className="flex items-center space-x-4">
          <div>
            {isInvitedUser || isEmailUser || isFlyUser || hasInvalidImg ? (
              <div className="w-[40px] h-[40px] bg-surface-100 border border-overlay rounded-full text-foreground-lighter flex items-center justify-center">
                <User size={20} strokeWidth={1.5} />
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

      <Table.td>
        <div className="flex items-center justify-center">
          {member.mfa_enabled ? (
            <Check className="text-brand" strokeWidth={2} size={20} />
          ) : (
            <X className="text-foreground-light" strokeWidth={1.5} size={20} />
          )}
        </div>
      </Table.td>

      <Table.td>
        {isLoadingRoles ? (
          <ShimmeringLoader className="w-32" />
        ) : (
          member.role_ids.map((id) => {
            const role = (roles ?? []).find((role) => role.id === id)
            const projectsApplied = projects?.map((p) => p.name) ?? []
            return (
              <div key={`role-${id}`} className="flex items-center gap-x-2">
                <span>{role?.name}</span>
                <span>•</span>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <span className="text-foreground">All projects</span>
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="bottom" className="flex flex-col gap-y-1">
                    {projectsApplied?.slice(0, 2).map((name) => <span key={name}>{name}</span>)}
                    {projectsApplied.length > 2 && (
                      <span>
                        And {projectsApplied.length - 2} other project
                        {projectsApplied.length > 4 ? 's' : ''}
                      </span>
                    )}
                  </TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              </div>
            )
          })
        )}
      </Table.td>

      <Table.td>{!memberIsUser && <MemberActions member={member} roles={roles} />}</Table.td>
    </Table.tr>
  )
}

export default MemberRow
