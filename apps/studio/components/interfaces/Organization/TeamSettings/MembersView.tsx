import { AlertCircle, Check, User, X } from 'lucide-react'
import Image from 'next/legacy/image'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationMemberUpdateMutation } from 'data/organizations/organization-member-update-mutation'
import {
  OrganizationMember,
  useOrganizationMembersQuery,
} from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks'
import { useProfile } from 'lib/profile'
import {
  Badge,
  Button,
  IconLoader,
  Listbox,
  Loading,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { getUserDisplayName, isInviteExpired } from '../Organization.utils'
import MemberActions from './MemberActions'
import RolesHelperModal from './RolesHelperModal/RolesHelperModal'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { useProjectsQuery } from 'data/projects/projects-query'

interface SelectedMember extends OrganizationMember {
  oldRoleId: number
  newRoleId: number
}

export interface MembersViewProps {
  searchString: string
}

const MembersView = ({ searchString }: MembersViewProps) => {
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()

  const { profile } = useProfile()
  const { data: permissions } = usePermissionsQuery()
  const { data: projects } = useProjectsQuery()
  const {
    data: members,
    error: membersError,
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    isSuccess: isSuccessMembers,
  } = useOrganizationMembersQuery({ slug })
  const {
    data: rolesData,
    error: rolesError,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
  } = useOrganizationRolesQuery({ slug })
  const { mutate: updateOrganizationMember, isLoading } = useOrganizationMemberUpdateMutation({
    onSuccess() {
      setUserRoleChangeModalVisible(false)
      toast.success(`Successfully updated role for ${getUserDisplayName(selectedMember)}`)
    },
    onError(error) {
      toast.error(
        `Failed to update role for ${getUserDisplayName(selectedMember)}: ${error.message}`
      )
    },
  })

  const allMembers = members ?? []
  const roles = rolesData?.roles ?? []
  const { rolesAddable, rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
    roles,
    permissions ?? []
  )

  const showMfaEnabledColumn = allMembers.some(
    (member) => member.gotrue_id !== undefined && member.mfa_enabled !== undefined
  )
  const [selectedMember, setSelectedMember] = useState<SelectedMember>()
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)

  const filteredMembers = (
    !searchString
      ? allMembers
      : allMembers.filter((x: any) => {
          if (x.invited_at) {
            return x.primary_email.includes(searchString)
          }
          if (x.id || x.gotrue_id) {
            return x.username.includes(searchString) || x.primary_email.includes(searchString)
          }
        })
  )
    .slice()
    .sort((a: any, b: any) => a.username.localeCompare(b.username))

  const getRoleNameById = (id: number | undefined) => {
    if (!roles) return id
    return roles.find((x: any) => x.id === id)?.name
  }

  const handleRoleChange = async () => {
    if (!selectedMember) return

    const { gotrue_id, newRoleId } = selectedMember
    if (!slug) return console.error('slug is required')
    if (!gotrue_id) return console.error('gotrue_id is required')
    updateOrganizationMember({ slug, gotrueId: gotrue_id, roleId: newRoleId })
  }

  return (
    <>
      {isLoadingMembers && <GenericSkeletonLoader />}

      {isErrorMembers && (
        <AlertError error={membersError} subject="Failed to retrieve organization members" />
      )}

      {isErrorRoles && (
        <AlertError error={rolesError} subject="Failed to retrieve organization roles" />
      )}

      {isSuccessMembers && (
        <div className="rounded w-full">
          <Loading active={!filteredMembers}>
            <Table
              head={[
                <Table.th key="header-user">User</Table.th>,
                <Table.th key="header-status" className="w-24" />,
                ...(showMfaEnabledColumn
                  ? [
                      <Table.th key="header-mfa" className="text-center w-32">
                        Enabled MFA
                      </Table.th>,
                    ]
                  : []),
                <Table.th key="header-role" className="flex items-center space-x-2">
                  <span>Role</span>
                  <RolesHelperModal />
                </Table.th>,
                <Table.th key="header-action" />,
              ]}
              body={[
                ...filteredMembers.map((x, i: number) => {
                  const memberIsUser = x.primary_email == profile?.primary_email
                  const isEmailUser = x.username === x.primary_email

                  return (
                    <Fragment key={`member-row-${i}`}>
                      <Table.tr>
                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>
                              {x.invited_id ? (
                                <span className="flex p-2 border-2 rounded-full border-strong">
                                  <User size={20} strokeWidth={2} />
                                </span>
                              ) : isEmailUser ? (
                                <div className="w-[40px] h-[40px] bg-surface-100 border border-overlay rounded-full text-foreground-lighter flex items-center justify-center">
                                  <User size={20} strokeWidth={1.5} />
                                </div>
                              ) : (
                                <Image
                                  alt={x.username}
                                  src={`https://github.com/${x.username}.png?size=80`}
                                  width="40"
                                  height="40"
                                  className="border rounded-full"
                                />
                              )}
                            </div>
                            <div>
                              <p className="text-foreground">{getUserDisplayName(x)}</p>
                              {x.invited_id === undefined && (
                                <p className="text-foreground-light">{x.primary_email}</p>
                              )}
                            </div>
                          </div>
                        </Table.td>

                        <Table.td>
                          {x.invited_id && x.invited_at && (
                            <Badge
                              variant={isInviteExpired(x.invited_at) ? 'destructive' : 'warning'}
                            >
                              {isInviteExpired(x.invited_at) ? 'Expired' : 'Invited'}
                            </Badge>
                          )}
                        </Table.td>

                        {showMfaEnabledColumn && (
                          <Table.td>
                            <div className="flex items-center justify-center">
                              {x.mfa_enabled ? (
                                <Check className="text-brand" strokeWidth={2} size={20} />
                              ) : (
                                <X className="text-foreground-light" strokeWidth={1.5} size={20} />
                              )}
                            </div>
                          </Table.td>
                        )}

                        <Table.td>
                          {x.role_ids.map((id) => {
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
                                  <TooltipContent_Shadcn_
                                    side="bottom"
                                    className="flex flex-col gap-y-1"
                                  >
                                    {projectsApplied
                                      ?.slice(0, 2)
                                      .map((name) => <span key={name}>{name}</span>)}
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
                          })}
                        </Table.td>

                        <Table.td>
                          {!memberIsUser && <MemberActions member={x} roles={roles} />}
                        </Table.td>
                      </Table.tr>
                    </Fragment>
                  )
                }),
                ...(searchString.length > 0 && filteredMembers.length === 0
                  ? [
                      <Table.tr key="no-results" className="bg-panel-secondary-light">
                        <Table.td colSpan={12}>
                          <div className="flex items-center space-x-3 opacity-75">
                            <AlertCircle size={16} strokeWidth={2} />
                            <p className="text-foreground-light">
                              No users matched the search query "{searchString}"
                            </p>
                          </div>
                        </Table.td>
                      </Table.tr>,
                    ]
                  : []),
                <Table.tr key="footer" className="bg-panel-secondary-light">
                  <Table.td colSpan={12}>
                    <p className="text-foreground-light">
                      {searchString ? `${filteredMembers.length} of ` : ''}
                      {allMembers.length || '0'} {allMembers.length == 1 ? 'user' : 'users'}
                    </p>
                  </Table.td>
                </Table.tr>,
              ]}
            />
          </Loading>
        </div>
      )}

      <Modal
        hideFooter
        size="medium"
        visible={userRoleChangeModalVisible}
        onCancel={() => setUserRoleChangeModalVisible(false)}
        header="Change role of member"
      >
        <div className="flex flex-col gap-2 py-4">
          <Modal.Content>
            <p className="text-sm text-foreground-light">
              You are changing the role of{' '}
              <span className="text-foreground">{getUserDisplayName(selectedMember)}</span> from{' '}
              <span className="text-foreground">{getRoleNameById(selectedMember?.oldRoleId)}</span>{' '}
              to{' '}
              <span className="text-foreground">{getRoleNameById(selectedMember?.newRoleId)}</span>
            </p>
            <p className="mt-3 text-sm text-foreground">
              By changing the role of this member their permissions will change.
            </p>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <div className="flex gap-3">
              <Button
                type="default"
                block
                size="medium"
                onClick={() => setUserRoleChangeModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                block
                type="warning"
                size="medium"
                disabled={isLoading}
                loading={isLoading}
                onClick={() => handleRoleChange()}
              >
                Confirm
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default MembersView
