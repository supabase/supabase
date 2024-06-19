import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationMemberUpdateMutation } from 'data/organizations/organization-member-update-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { Button, IconAlertCircle, Loading, Modal } from 'ui'
import { getUserDisplayName } from '../Organization.utils'
import MemberRow, { SelectedMember } from './MemberRow'
import RolesHelperModal from './RolesHelperModal/RolesHelperModal'

export interface MembersViewProps {
  searchString: string
}

const MembersView = ({ searchString }: MembersViewProps) => {
  const { slug } = useParams()

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

  // [Joshen] Proactively adding this, can be removed once infra API changes are in
  const showMfaEnabledColumn = allMembers.some(
    (member) => member.gotrue_id !== undefined && member.mfa_enabled !== undefined
  )
  const [selectedMember, setSelectedMember] = useState<SelectedMember>()
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)

  const filteredMembers = (
    !searchString
      ? allMembers
      : allMembers.filter((member) => {
          if (member.invited_at) {
            return member.primary_email?.includes(searchString)
          }
          if (member.gotrue_id) {
            return (
              member.username.includes(searchString) || member.primary_email?.includes(searchString)
            )
          }
        })
  )
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))

  const getRoleNameById = (id: number | undefined) => {
    if (!roles) return id
    return roles.find((member) => member.id === id)?.name
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
                <Table.th key="header-status"></Table.th>,
                ...(showMfaEnabledColumn
                  ? [
                      <Table.th key="header-mfa" className="text-center">
                        Enabled MFA
                      </Table.th>,
                    ]
                  : []),
                <Table.th key="header-role" className="flex items-center space-x-2">
                  <span>Role</span>
                  <RolesHelperModal />
                </Table.th>,
                <Table.th key="header-action"></Table.th>,
              ]}
              body={[
                ...filteredMembers.map((member) => (
                  <MemberRow
                    key={member.gotrue_id}
                    member={member}
                    roles={roles}
                    isLoadingRoles={isLoadingRoles}
                    showMfaEnabledColumn={showMfaEnabledColumn}
                    setUserRoleChangeModalVisible={setUserRoleChangeModalVisible}
                    setSelectedMember={setSelectedMember}
                  />
                )),
                ...(searchString.length > 0 && filteredMembers.length === 0
                  ? [
                      <Table.tr key="no-results" className="bg-panel-secondary-light">
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
        <Modal.Content>
          <p className="text-sm text-foreground-light">
            You are changing the role of{' '}
            <span className="text-foreground">{getUserDisplayName(selectedMember)}</span> from{' '}
            <span className="text-foreground">{getRoleNameById(selectedMember?.oldRoleId)}</span> to{' '}
            <span className="text-foreground">{getRoleNameById(selectedMember?.newRoleId)}</span>
          </p>
          <p className="mt-3 text-sm text-foreground">
            By changing the role of this member their permissions will change.
          </p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex gap-3">
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
        </Modal.Content>
      </Modal>
    </>
  )
}

export default MembersView
