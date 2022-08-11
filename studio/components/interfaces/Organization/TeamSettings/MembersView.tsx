import Image from 'next/image'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useState, useContext, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, Button, Loading, Listbox, IconUser, Modal } from '@supabase/ui'

import { Member, Role } from 'types'
import { useStore, useFlag, useOrganizationDetail } from 'hooks'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { isInviteExpired, getUserDisplayName } from '../Organization.utils'

import Table from 'components/to-be-cleaned/Table'
import MemberActions from './MemberActions'
import RolesHelperModal from './RolesHelperModal/RolesHelperModal'
import { PageContext } from 'pages/org/[slug]/settings'
import { getRolesManagementPermissions } from './TeamSettings.utils'

interface SelectedMember extends Member {
  oldRoleId: number
  newRoleId: number
}

const MembersView = () => {
  const PageState: any = useContext(PageContext)
  const { roles }: { roles: Role[] } = PageState
  const { rolesAddable, rolesRemovable } = getRolesManagementPermissions(roles)

  const { ui } = useStore()
  const slug = ui.selectedOrganization?.slug || ''
  const isOwner = ui.selectedOrganization?.is_owner

  const enablePermissions = useFlag('enablePermissions')
  const { mutateOrgMembers } = useOrganizationDetail(slug)

  const [loading, setLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<SelectedMember>()
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)

  const hasAccessToMemberActions = enablePermissions ? true : isOwner

  const getRoleNameById = (id: number | undefined) => {
    if (!roles) return id
    return roles.find((x: any) => x.id === id)?.name
  }

  const handleRoleChange = async () => {
    if (!selectedMember) return

    setLoading(true)
    const { gotrue_id, newRoleId } = selectedMember
    const response = await patch(`${API_URL}/organizations/${slug}/members/${gotrue_id}`, {
      role_id: newRoleId,
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update role for ${getUserDisplayName(selectedMember)}`,
      })
    } else {
      const updatedMembers = PageState.members.map((member: Member) => {
        if (member.gotrue_id === selectedMember.gotrue_id) {
          return { ...member, role_ids: [newRoleId] }
        } else {
          return member
        }
      })
      mutateOrgMembers(updatedMembers)
      ui.setNotification({
        category: 'success',
        message: `Successfully updated role for ${getUserDisplayName(selectedMember)}`,
      })
    }

    setLoading(false)
    setUserRoleChangeModalVisible(false)
  }

  return (
    <>
      <div className="rounded">
        <Loading active={!PageState.filteredMembers}>
          <Table
            head={[
              <Table.th key="header-user">User</Table.th>,
              <Table.th key="header-status"></Table.th>,
              <Table.th key="header-role" className="flex items-center space-x-2">
                <span>Role</span>
                {enablePermissions && <RolesHelperModal />}
              </Table.th>,
              <Table.th key="header-action"></Table.th>,
            ]}
            body={[
              PageState.filteredMembers.map((x: Member, i: number) => {
                const [memberRoleId] = x.role_ids ?? []
                const role = (roles || []).find((role) => role.id === memberRoleId)
                const memberIsUser = x.primary_email == PageState.user.primary_email
                const memberIsPendingInvite = !!x.invited_id
                const canRemoveRole = rolesRemovable.includes(memberRoleId)
                const disableRoleEdit = !canRemoveRole || memberIsUser || memberIsPendingInvite

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
                              <span className="border-border-secondary-light dark:border-border-secondary-dark flex rounded-full border-2 p-2">
                                <IconUser size={20} strokeWidth={2} />
                              </span>
                            ) : (
                              <Image
                                src={`https://github.com/${x.username}.png?size=80`}
                                width="40"
                                height="40"
                                className="rounded-full border"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-scale-1200">{getUserDisplayName(x)}</p>
                            {x.invited_id === undefined && (
                              <p className="text-scale-1100">{x.primary_email}</p>
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
                        {!role && !enablePermissions && <p>{x.is_owner ? 'Owner' : 'Developer'}</p>}
                        {role && (
                          <>
                            {!enablePermissions ? (
                              <p>{role?.name ?? 'Developer'}</p>
                            ) : (
                              <Tooltip.Root delayDuration={0}>
                                <Tooltip.Trigger>
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
                                      >
                                        {r.name}
                                      </Listbox.Option>
                                    ))}
                                  </Listbox>
                                </Tooltip.Trigger>
                                {memberIsPendingInvite ? (
                                  <Tooltip.Content side="bottom">
                                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                                    <div
                                      className={[
                                        'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                                        'border-scale-200 border ', //border
                                      ].join(' ')}
                                    >
                                      <span className="text-scale-1200 text-xs">
                                        Role can only be changed after the user has accepted the
                                        invite
                                      </span>
                                    </div>
                                  </Tooltip.Content>
                                ) : !memberIsUser && !canRemoveRole ? (
                                  <Tooltip.Content side="bottom">
                                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                                    <div
                                      className={[
                                        'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                                        'border-scale-200 border ', //border
                                      ].join(' ')}
                                    >
                                      <span className="text-scale-1200 text-xs">
                                        You need additional permissions to manage this team member
                                      </span>
                                    </div>
                                  </Tooltip.Content>
                                ) : (
                                  <></>
                                )}
                              </Tooltip.Root>
                            )}
                          </>
                        )}
                      </Table.td>
                      <Table.td>
                        {hasAccessToMemberActions && !memberIsUser && (
                          <MemberActions members={PageState.members} member={x} roles={roles} />
                        )}
                      </Table.td>
                    </Table.tr>
                  </Fragment>
                )
              }),
              <Table.tr
                key="footer"
                className="bg-panel-secondary-light dark:bg-panel-secondary-dark"
              >
                <Table.td colSpan={4}>
                  <p className="text-scale-1100">
                    {PageState.membersFilterString ? `${PageState.filteredMembers.length} of ` : ''}
                    {PageState.members.length || '0'}{' '}
                    {PageState.members.length == 1 ? 'user' : 'users'}
                  </p>
                </Table.td>
              </Table.tr>,
            ]}
          />
        </Loading>
      </div>

      <Modal
        hideFooter
        size="medium"
        visible={userRoleChangeModalVisible}
        onCancel={() => setUserRoleChangeModalVisible(false)}
        header="Change role of member"
      >
        <div className="flex flex-col gap-2 py-4">
          <Modal.Content>
            <p className="text-sm text-scale-1100">
              You are changing the role of{' '}
              <span className="text-scale-1200">{getUserDisplayName(selectedMember)}</span> from{' '}
              <span className="text-scale-1200">{getRoleNameById(selectedMember?.oldRoleId)}</span>{' '}
              to{' '}
              <span className="text-scale-1200">{getRoleNameById(selectedMember?.newRoleId)}</span>
            </p>
            <p className="text-sm text-scale-1200 mt-3">
              By changing the role of this member their permissions will change.
            </p>
          </Modal.Content>
          <Modal.Seperator />
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
                disabled={loading}
                loading={loading}
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
