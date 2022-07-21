import useSWR from 'swr'
import Image from 'next/image'
import { useState, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, Button, Loading, Listbox, IconUser, Modal } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { User } from 'types'
import { useStore, useOrganizationDetail } from 'hooks'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import { checkPermissions } from 'lib/common/permissions'
import { isInviteExpired } from '../Organization.utils'

import Table from 'components/to-be-cleaned/Table'
import OwnerDropdown from './OwnerDropdown'
import { PageContext } from 'pages/org/[slug]/settings'

interface SelectedUserProps extends User {
  oldRoleId: number
  newRoleId: number
}

const MembersView = observer(() => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')

  // Handle visibility of role change modal
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)

  // Handle the user details of a user who is being changed
  const [selectedUser, setSelectedUser] = useState<SelectedUserProps>()

  // Loading state of role change fetch request
  const [loading, setLoading] = useState(false)

  // Fetch roles available for this org
  const { data: roles, error: rolesError } = useSWR(
    `${API_URL}/organizations/${PageState.organization.slug}/roles`,
    get
  )

  const handleRoleChange = async () => {}

  const canEditMembers = checkPermissions(PermissionAction.SQL_INSERT, 'postgres.public.members')

  function getRoleNameById(id: number | undefined) {
    if (!roles) return id
    return roles.find((x: any) => x.id === id)?.name
  }

  // TO DO - refactor to use new endpoints
  // async function handleRoleChange(
  //   checked: boolean,
  //   roleId: number,
  //   gotrueId: number,
  //   member: Member
  // ) {
  //   return true
  //   setLoading(true)
  //   const response = await (checked ? post : delete_)(
  //     `${API_URL}/users/${gotrueId}/roles/${roleId}`,
  //     {}
  //   )
  //   if (response.error) {
  //     ui.setNotification({
  //       category: 'error',
  //       message: `Failed to ${checked ? 'add' : 'remove'} member's role: ${response.error.message}`,
  //     })
  //   } else {
  //     const updatedMembers = [...PageState.members]
  //     const updatedMember = updatedMembers.find((x) => x.id == member.id)
  //     if (checked) {
  //       updatedMember.role_ids.push(roleId)
  //     } else {
  //       updatedMember.role_ids = updatedMember.role_ids.filter(
  //         (role_id: number) => role_id != roleId
  //       )
  //     }
  //     mutateOrgMembers(updatedMembers)
  //     ui.setNotification({
  //       category: 'success',
  //       message: `Successfully ${checked ? 'added' : 'removed'} member's role`,
  //     })
  //   }
  //   setLoading(false)
  // }

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
              PageState.filteredMembers.map((x: any, i: number) => {
                function findIdOfRole(roles: any, roleName: string) {
                  const found = roles.find((x: any) => x.name === roleName)
                  return found.id
                }

                const OwnerRoleId = roles && findIdOfRole(roles, 'Owner')
                const AdminRoleId = roles && findIdOfRole(roles, 'Administrator')
                const DeveloperRoleId = roles && findIdOfRole(roles, 'Developer')

                let activeRoleId: number | undefined = undefined

                /**
                 * Move through the roles and find the one that matches the user's role
                 * The bottom roles are the most senior ie, Owner
                 */
                if (x.role_ids?.includes(DeveloperRoleId)) {
                  activeRoleId = DeveloperRoleId
                }
                if (x.role_ids?.includes(AdminRoleId)) {
                  activeRoleId = AdminRoleId
                }
                if (x.role_ids?.includes(OwnerRoleId)) {
                  activeRoleId = OwnerRoleId
                }

                console.log(x.username, activeRoleId)

                const memberIsUser = x.primary_email == PageState.user.primary_email

                return (
                  <>
                    <Table.tr key={i}>
                      <Table.td>
                        <div className="flex items-center space-x-4">
                          <div>
                            {x.invited_id ? (
                              <span className="border-border-secondary-light dark:border-border-secondary-dark flex rounded-full border-2 p-2">
                                <IconUser size={18} strokeWidth={2} />
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
                            {x.username && !x.invited_id && (
                              <p className="text-scale-1200">{x.username}</p>
                            )}
                            <p className="text-scale-1100">{x.primary_email}</p>
                          </div>
                        </div>
                      </Table.td>

                      <Table.td>
                        {x.invited_id && (
                          <Badge color={isInviteExpired(x.invited_at) ? 'yellow' : 'red'}>
                            {isInviteExpired(x.invited_at) ? 'Invited' : 'Expired'}
                          </Badge>
                        )}
                      </Table.td>

                      <Table.td>
                        {activeRoleId && (
                          <Listbox
                            disabled={!canEditMembers || memberIsUser}
                            value={activeRoleId ?? roles[0].id}
                            onChange={(roleId): any => {
                              setUserRoleChangeModalVisible(true)
                              setSelectedUser({
                                ...x,
                                oldRoleId: activeRoleId,
                                newRoleId: roleId,
                              })
                            }}
                          >
                            {roles.map((role: any) => (
                              <Listbox.Option key={role.id} value={role.id} label={role.name}>
                                {role.name}
                              </Listbox.Option>
                            ))}
                          </Listbox>
                        )}
                      </Table.td>
                      <Table.td>
                        {PageState.isOrgOwner && (
                          <OwnerDropdown members={PageState.members} member={x} roles={roles} />
                        )}
                      </Table.td>
                    </Table.tr>
                  </>
                )
              }),
              <Table.tr
                key="footer"
                // @ts-ignore
                colSpan="3"
                className="bg-panel-secondary-light dark:bg-panel-secondary-dark"
              >
                {/* @ts-ignore */}
                <Table.td colSpan="4">
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
            <p className="text-scale-1200 mb-3">
              By changing the role of this member their permissions will change.
            </p>
            <p className="text-sm text-scale-1100">
              You are going to change the role of {selectedUser?.primary_email} from{' '}
              <span className="text-scale-1200">{getRoleNameById(selectedUser?.oldRoleId)}</span> to{' '}
              <span className="text-scale-1200">{getRoleNameById(selectedUser?.newRoleId)}</span>
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
              <Button type="warning" block size="medium" onClick={() => handleRoleChange()}>
                Confirm
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
})

export default MembersView
