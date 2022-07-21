import { useState, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, IconTrash, IconMoreHorizontal } from '@supabase/ui'

import { Member } from 'types'
import { useStore, useOrganizationDetail } from 'hooks'
import { timeout } from 'lib/helpers'
import { delete_, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

import { PageContext } from 'pages/org/[slug]/settings'

const OwnerDropdown = observer(({ members, member, roles }: any) => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // handle modal visibility
  const [ownerTransferIsVisble, setOwnerTransferIsVisble] = useState(false)

  const { id: orgId, slug: orgSlug, stripe_customer_id, name: orgName } = PageState.organization

  async function handleMemberDelete() {
    setIsOpen(false)
    await timeout(200)

    confirmAlert({
      title: 'Confirm to remove',
      message: `This is permanent! Are you sure you want to remove ${member.primary_email}?`,
      onAsyncConfirm: async () => {
        setLoading(true)
        const response = await delete_(`${API_URL}/organizations/${orgSlug}/members/remove`, {
          member_id: member.member_id,
        })
        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to delete user: ${response.error.message}`,
          })
          setLoading(false)
        } else {
          const updatedMembers = members.filter((x: any) => x.id !== member.id)
          mutateOrgMembers(updatedMembers)
          ui.setNotification({
            category: 'success',
            message: 'Successfully removed member',
          })
        }
      },
    })
  }

  async function handleTransfer() {
    setLoading(true)

    const response = await post(`${API_URL}/organizations/${orgSlug}/transfer`, {
      org_id: orgId,
      member_id: member.id,
    })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to transfer ownership: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      const updatedMembers = [...members]
      const oldOwner = updatedMembers.find((x) => x.is_owner == true)
      if (oldOwner) oldOwner.is_owner = false
      const newOwner = updatedMembers.find((x) => x.id == member.id)
      if (newOwner) newOwner.is_owner = true
      mutateOrgMembers(updatedMembers)
      setOwnerTransferIsVisble(false)
      ui.setNotification({
        category: 'success',
        message: 'Successfully transfered organization',
      })
    }
  }

  async function handleRoleChecked(checked: boolean, roleId: number) {
    setLoading(true)
    const response = await (checked ? post : delete_)(
      `${API_URL}/users/${member.gotrue_id}/roles/${roleId}`,
      {}
    )
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to ${checked ? 'add' : 'remove'} member's role: ${response.error.message}`,
      })
    } else {
      const updatedMembers = [...members]
      const updatedMember = updatedMembers.find((x) => x.id == member.id)
      if (checked) {
        updatedMember.role_ids.push(roleId)
      } else {
        updatedMember.role_ids = updatedMember.role_ids.filter(
          (role_id: number) => role_id != roleId
        )
      }
      mutateOrgMembers(updatedMembers)
      ui.setNotification({
        category: 'success',
        message: `Successfully ${checked ? 'added' : 'removed'} member's role`,
      })
    }
    setLoading(false)
  }

  async function handleResendInvite(member: Member) {
    setLoading(true)

    const response = await post(`${API_URL}/organizations/${orgSlug}/members/invite`, {
      invited_email: member.primary_email,
      owner_id: member.invited_id,
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to resend invitation: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      const updatedMembers = [...members]
      mutateOrgMembers(updatedMembers)
      ui.setNotification({ category: 'success', message: 'Resent the invitation.' })
      setLoading(false)
    }
  }

  async function handleRevokeInvitation(id: number) {
    setLoading(true)

    const response = await delete_(
      `${API_URL}/organizations/${orgSlug}/members/invite?invited_id=${id}`,
      {}
    )

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to revoke invitation: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      const updatedMembers = [...members]
      mutateOrgMembers(updatedMembers)
      ui.setNotification({ category: 'success', message: 'Successfully revoked the invitation.' })
    }
  }

  return (
    <div className="flex items-center justify-end">
      <Dropdown
        side="bottom"
        align="end"
        overlay={
          <>
            <Dropdown.Label>Roles</Dropdown.Label>
            {roles &&
              roles
                ?.filter(({ name }: { name: string }) => name !== 'Owner')
                .map(({ id, name }: { id: number; name: string }) => (
                  <Dropdown.Checkbox
                    checked={member?.role_ids?.includes(id)}
                    onChange={(checked) => handleRoleChecked(checked, id)}
                  >
                    {name}
                  </Dropdown.Checkbox>
                ))}
            <Dropdown.Seperator />
            {!member.invited_at && (
              <Dropdown.Item onClick={() => setOwnerTransferIsVisble(!ownerTransferIsVisble)}>
                <div className="flex flex-col">
                  <p>Make owner</p>
                  <p className="block opacity-50">Transfer ownership of "{orgName}"</p>
                </div>
              </Dropdown.Item>
            )}

            {member.invited_at && (
              <>
                <Dropdown.Item onClick={() => handleRevokeInvitation(member.invited_id)}>
                  <div className="flex flex-col">
                    <p>Cancel invitation</p>
                    <p className="block opacity-50">Revoke this invitation.</p>
                  </div>
                </Dropdown.Item>

                {/* {!inviteExpired(member.invited_at) && ( */}
                <>
                  <Dropdown.Seperator />
                  <Dropdown.Item onClick={() => handleResendInvite(member)}>
                    <div className="flex flex-col">
                      <p>Resend invitation</p>
                      <p className="block opacity-50">Invites expire after 24hrs.</p>
                    </div>
                  </Dropdown.Item>
                </>
                {/* )} */}
              </>
            )}

            {!member.invited_at && (
              <>
                <Dropdown.Seperator />
                <Dropdown.Item icon={<IconTrash size="tiny" />} onClick={handleMemberDelete}>
                  Remove member
                </Dropdown.Item>
              </>
            )}
          </>
        }
      >
        <Button
          as="span"
          disabled={loading}
          loading={loading}
          type="text"
          icon={<IconMoreHorizontal />}
        ></Button>
      </Dropdown>

      <TextConfirmModal
        title="Transfer organization"
        visible={ownerTransferIsVisble}
        confirmString={orgSlug}
        loading={loading}
        confirmLabel="I understand, transfer ownership"
        confirmPlaceholder="Type in name of orgnization"
        onCancel={() => setOwnerTransferIsVisble(!ownerTransferIsVisble)}
        onConfirm={handleTransfer}
        alert="Payment methods such as credit cards will also be transferred. You may want to delete credit card information first before transferring."
        text={
          <span>
            By transferring this organization, it will be solely owned by{' '}
            <span className="font-medium dark:text-white">{member.profile?.username}</span>, they
            will also be able to remove you from the organization as a member
          </span>
        }
      />
    </div>
  )
})

export default OwnerDropdown
