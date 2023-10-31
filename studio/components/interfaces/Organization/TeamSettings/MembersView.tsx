import * as Tooltip from '@radix-ui/react-tooltip'
import { observer } from 'mobx-react-lite'
import Image from 'next/legacy/image'
import { Fragment, useState } from 'react'

import { useParams } from 'common/hooks'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationMemberUpdateMutation } from 'data/organizations/organization-member-update-mutation'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { useProfile } from 'lib/profile'
import { Member } from 'types'
import { Badge, Button, IconAlertCircle, IconLoader, IconUser, Listbox, Loading, Modal } from 'ui'
import { getUserDisplayName, isInviteExpired } from '../Organization.utils'
import MemberActions from './MemberActions'
import RolesHelperModal from './RolesHelperModal/RolesHelperModal'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

interface SelectedMember extends Member {
  oldRoleId: number
  newRoleId: number
}

export interface MembersViewProps {
  searchString: string
}

const MembersView = ({ searchString }: MembersViewProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()

  const { profile } = useProfile()
  const { data: permissions } = usePermissionsQuery()
  const {
    data: detailData,
    error: detailError,
    isLoading: isLoadingOrgDetails,
    isError: isErrorOrgDetails,
    isSuccess: isSuccessOrgDetails,
  } = useOrganizationDetailQuery({ slug })
  const {
    data: rolesData,
    error: rolesError,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
  } = useOrganizationRolesQuery({ slug })
  const { mutate: updateOrganizationMember, isLoading } = useOrganizationMemberUpdateMutation({
    onSuccess() {
      setUserRoleChangeModalVisible(false)
      ui.setNotification({
        category: 'success',
        message: `Successfully updated role for ${getUserDisplayName(selectedMember)}`,
      })
    },
    onError(error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update role for ${getUserDisplayName(selectedMember)}: ${
          error.message
        }`,
      })
    },
  })

  const roles = rolesData?.roles ?? []
  const members = detailData?.members ?? []
  const { rolesAddable, rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
    roles,
    permissions ?? []
  )

  const [selectedMember, setSelectedMember] = useState<SelectedMember>()
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)

  const filteredMembers = (
    !searchString
      ? members
      : members.filter((x: any) => {
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
      {isLoadingOrgDetails && <GenericSkeletonLoader />}

      {isErrorOrgDetails && (
        <AlertError error={detailError} subject="Failed to retrieve organization members" />
      )}

      {isErrorRoles && (
        <AlertError error={rolesError} subject="Failed to retrieve organization roles" />
      )}

      {isSuccessOrgDetails && (
        <div className="rounded w-full">
          <Loading active={!filteredMembers}>
            <Table
              head={[
                <Table.th key="header-user">User</Table.th>,
                <Table.th key="header-status"></Table.th>,
                <Table.th key="header-role" className="flex items-center space-x-2">
                  <span>Role</span>
                  <RolesHelperModal />
                </Table.th>,
                <Table.th key="header-action"></Table.th>,
              ]}
              body={[
                ...filteredMembers.map((x: Member, i: number) => {
                  const [memberRoleId] = x.role_ids ?? []
                  const role = (roles || []).find((role) => role.id === memberRoleId)
                  const memberIsUser = x.primary_email == profile?.primary_email
                  const memberIsPendingInvite = !!x.invited_id
                  const canRemoveRole = rolesRemovable.includes(memberRoleId)
                  const disableRoleEdit = !canRemoveRole || memberIsUser || memberIsPendingInvite
                  const isEmailUser = x.username === x.primary_email

                  const validateSelectedRoleToChange = (roleId: any) => {
                    if (!role || role.id === roleId) return

                    const selectedRole = (roles || []).find((role) => role.id === roleId)
                    const canAddRole = rolesAddable.includes(selectedRole?.id ?? -1)

                    if (!canAddRole) {
                      return ui.setNotification({
                        category: 'error',
                        duration: 4000,
                        message: `You do not have permission to update this team member to ${
                          selectedRole!.name
                        }`,
                      })
                    }

                    setUserRoleChangeModalVisible(true)
                    setSelectedMember({ ...x, oldRoleId: role.id, newRoleId: roleId })
                  }

                  return (
                    <Fragment key={`member-row-${i}`}>
                      <Table.tr>
                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>
                              {x.invited_id ? (
                                <span className="flex p-2 border-2 rounded-full border-strong">
                                  <IconUser size={20} strokeWidth={2} />
                                </span>
                              ) : isEmailUser ? (
                                <div className="w-[40px] h-[40px] bg-surface-100 border border-overlay rounded-full text-foreground-lighter flex items-center justify-center">
                                  <IconUser strokeWidth={1.5} />
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
                            <Badge color={isInviteExpired(x.invited_at) ? 'red' : 'yellow'}>
                              {isInviteExpired(x.invited_at) ? 'Expired' : 'Invited'}
                            </Badge>
                          )}
                        </Table.td>

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
                              {memberIsPendingInvite ? (
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
                                        Role can only be changed after the user has accepted the
                                        invite
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
                                        This user has an invalid role, please reach out to us via
                                        support
                                      </span>
                                    </div>
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            </div>
                          )}
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
                      <Table.tr
                        key="no-results"
                        className="bg-panel-secondary-light dark:bg-panel-secondary-dark"
                      >
                        <Table.td colSpan={12}>
                          <div className="flex items-center space-x-3 opacity-75">
                            <IconAlertCircle size={16} strokeWidth={2} />
                            <p className="text-foreground-light">
                              No users matched the search query "{searchString}"
                            </p>
                          </div>
                        </Table.td>
                      </Table.tr>,
                    ]
                  : []),
                <Table.tr
                  key="footer"
                  className="bg-panel-secondary-light dark:bg-panel-secondary-dark"
                >
                  <Table.td colSpan={4}>
                    <p className="text-foreground-light">
                      {searchString ? `${filteredMembers.length} of ` : ''}
                      {members.length || '0'} {members.length == 1 ? 'user' : 'users'}
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

export default observer(MembersView)
