import Image from 'next/image'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useState, FC, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, Button, Loading, Listbox, IconUser, Modal, IconAlertCircle } from 'ui'

import { Member, Role } from 'types'
import { useStore, useParams } from 'hooks'
import { isInviteExpired, getUserDisplayName } from '../Organization.utils'

import Table from 'components/to-be-cleaned/Table'
import MemberActions from './MemberActions'
import RolesHelperModal from './RolesHelperModal/RolesHelperModal'
import { getRolesManagementPermissions } from './TeamSettings.utils'
import { useOrganizationMemberUpdateMutation } from 'data/organizations/organization-member-update-mutation'

interface SelectedMember extends Member {
  oldRoleId: number
  newRoleId: number
}

interface Props {
  roles: Role[]
  members: Member[]
  searchString: string
}

const MembersView: FC<Props> = ({ searchString, roles, members }) => {
  const { ui } = useStore()
  const { slug } = useParams()

  const user = ui.profile

  const { rolesAddable, rolesRemovable } = getRolesManagementPermissions(roles)

  const [selectedMember, setSelectedMember] = useState<SelectedMember>()
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)

  if (!members) return <div />

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

  const { isLoading, mutate } = useOrganizationMemberUpdateMutation({
    onSuccess() {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated role for ${getUserDisplayName(selectedMember)}`,
      })
    },
    onError() {
      ui.setNotification({
        category: 'error',
        message: `Failed to update role for ${getUserDisplayName(selectedMember)}`,
      })
    },
  })

  const handleRoleChange = async () => {
    if (!selectedMember) return

    const { gotrue_id, newRoleId } = selectedMember

    if (!slug) {
      throw new Error('slug is required')
    }
    if (!gotrue_id) {
      throw new Error('gotrue_id is required')
    }

    mutate({ slug, gotrueId: gotrue_id, roleId: newRoleId })

    setUserRoleChangeModalVisible(false)
  }

  return (
    <>
      <div className="rounded">
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
                const memberIsUser = x.primary_email == user?.primary_email
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
                              <span className="flex p-2 border-2 rounded-full border-border-secondary-light dark:border-border-secondary-dark">
                                <IconUser size={20} strokeWidth={2} />
                              </span>
                            ) : isEmailUser ? (
                              <div className="w-[40px] h-[40px] bg-scale-300 border border-scale-400 rounded-full text-scale-900 flex items-center justify-center">
                                <IconUser strokeWidth={1.5} />
                              </div>
                            ) : (
                              <Image
                                src={`https://github.com/${x.username}.png?size=80`}
                                width="40"
                                height="40"
                                className="border rounded-full"
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
                        {!role && <p>{x.is_owner ? 'Owner' : 'Developer'}</p>}
                        {role && (
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
                                    'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                                    'border border-scale-200 ', //border
                                  ].join(' ')}
                                >
                                  <span className="text-xs text-scale-1200">
                                    Role can only be changed after the user has accepted the invite
                                  </span>
                                </div>
                              </Tooltip.Content>
                            ) : !memberIsUser && !canRemoveRole ? (
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
                            ) : (
                              <></>
                            )}
                          </Tooltip.Root>
                        )}
                      </Table.td>
                      <Table.td>
                        {!memberIsUser && (
                          <MemberActions members={members} member={x} roles={roles} />
                        )}
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
                          <p className="text-scale-1100">
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
                  <p className="text-scale-1100">
                    {searchString ? `${filteredMembers.length} of ` : ''}
                    {members.length || '0'} {members.length == 1 ? 'user' : 'users'}
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
            <p className="mt-3 text-sm text-scale-1200">
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
