import Image from 'next/image'
import { useState, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, Button, Loading, Listbox, IconUser, Modal } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { Member } from 'types'
import { checkPermissions, useStore, useOrganizationDetail, useOrganizationRoles } from 'hooks'
import { API_URL } from 'lib/constants'
import { isInviteExpired, getUserDisplayName } from '../Organization.utils'

import Table from 'components/to-be-cleaned/Table'
import OwnerDropdown from './OwnerDropdown'
import { PageContext } from 'pages/org/[slug]/settings'
import { post } from 'lib/common/fetch'

interface SelectedMember extends Member {
  oldRoleId: number
  newRoleId: number
}

const MembersView = () => {
  const PageState: any = useContext(PageContext)

  const { ui } = useStore()
  const slug = ui.selectedOrganization?.slug || ''

  const { roles } = useOrganizationRoles(slug)
  const { mutateOrgMembers } = useOrganizationDetail(slug)

  const [loading, setLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<SelectedMember>()
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)

  const canEditMembers = checkPermissions(PermissionAction.SQL_INSERT, 'postgres.public.members')

  const getRoleNameById = (id: number | undefined) => {
    if (!roles) return id
    return roles.find((x: any) => x.id === id)?.name
  }

  // [Joshen] This will need to be updated to use new PATCH endpoint once API is ready
  const handleRoleChange = async () => {
    if (!selectedMember) return

    setLoading(true)
    const { gotrue_id, newRoleId } = selectedMember
    const response = await post(`${API_URL}/users/${gotrue_id}/roles/${newRoleId}`, {})

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update role for ${getUserDisplayName(selectedMember)}`,
      })
    } else {
      const updatedMembers = PageState.members.map((member: Member) => {
        if (member.id === selectedMember.id) return { ...member, role_ids: [newRoleId] }
        else return member
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
              <Table.th key="header-role">Role</Table.th>,
              <Table.th key="header-action"></Table.th>,
            ]}
            body={[
              PageState.filteredMembers.map((x: Member, i: number) => {
                const [memberRoleId] = x.role_ids ?? []
                const role = (roles || []).find((role) => role.id === memberRoleId)
                const memberIsUser = x.primary_email == PageState.user.primary_email
                const disableRoleEdit = !canEditMembers || memberIsUser

                return (
                  <>
                    <Table.tr key={i}>
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
                        {role ? (
                          <p>{role?.name}</p>
                        ) : (
                          // [Joshen TODO] Commented out until roles management is completed
                          // <Listbox
                          //   className={disableRoleEdit ? 'pointer-events-none' : ''}
                          //   disabled={disableRoleEdit}
                          //   value={role.id}
                          //   onChange={(roleId): any => {
                          //     setUserRoleChangeModalVisible(true)
                          //     setSelectedMember({
                          //       ...x,
                          //       oldRoleId: role.id,
                          //       newRoleId: roleId,
                          //     })
                          //   }}
                          // >
                          //   {roles.map((role: any) => (
                          //     <Listbox.Option
                          //       key={role.id}
                          //       value={role.id}
                          //       label={role.name}
                          //       disabled={disableRoleEdit}
                          //     >
                          //       {role.name}
                          //     </Listbox.Option>
                          //   ))}
                          // </Listbox>
                          <p>Developer</p>
                        )}
                      </Table.td>
                      <Table.td>
                        {PageState.isOrgOwner && !memberIsUser && (
                          <OwnerDropdown members={PageState.members} member={x} />
                        )}
                      </Table.td>
                    </Table.tr>
                  </>
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
        visible={userRoleChangeModalVisible}
        hideFooter
        onCancel={() => setUserRoleChangeModalVisible(false)}
        header="Change role of member"
        size="small"
      >
        <div className="flex flex-col gap-2 my-3">
          <Modal.Content>
            <p className="text-sm text-scale-1200 mb-3">
              By changing the role of this member their permissions will change.
            </p>
            <p className="text-sm text-scale-1100">
              You are going to change the role of {selectedMember?.primary_email} from{' '}
              <span className="text-scale-1200">{getRoleNameById(selectedMember?.oldRoleId)}</span>{' '}
              to{' '}
              <span className="text-scale-1200">{getRoleNameById(selectedMember?.newRoleId)}</span>
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
