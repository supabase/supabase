import { FC, useState, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, IconTrash, IconMoreHorizontal } from '@supabase/ui'

import { Member, Role } from 'types'
import { useStore, useOrganizationDetail, useFlag } from 'hooks'
import { delete_, post, patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

import { PageContext } from 'pages/org/[slug]/settings'
import { getUserDisplayName } from '../Organization.utils'

interface Props {
  members: Member[]
  member: Member
  roles: Role[]
}

const OwnerDropdown: FC<Props> = ({ members, member, roles }) => {
  const PageState: any = useContext(PageContext)
  const { slug, name: orgName } = PageState.organization

  const { ui } = useStore()
  const enablePermissions = useFlag('enablePermissions')
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')

  const [loading, setLoading] = useState(false)
  const [ownerTransferIsVisible, setOwnerTransferIsVisible] = useState(false)

  const handleMemberDelete = async () => {
    confirmAlert({
      title: 'Confirm to remove',
      message: `This is permanent! Are you sure you want to remove ${member.primary_email}`,
      onAsyncConfirm: async () => {
        setLoading(true)
        const response = await delete_(
          `${API_URL}/organizations/${slug}/members/${member.gotrue_id}`
        )

        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to delete user: ${response.error.message}`,
          })
          setLoading(false)
        } else {
          const updatedMembers = members.filter((m) => m.gotrue_id !== member.gotrue_id)
          mutateOrgMembers(updatedMembers)
          ui.setNotification({
            category: 'success',
            message: `Successfully removed ${member.primary_email}`,
          })
        }
      },
    })
  }

  // [Joshen] This will be deprecated after ABAC is fully rolled out
  const handleTransferOwnership = async () => {
    setLoading(true)
    // Make new member the owner first
    const ownerRole = roles.find((role) => role.name === 'Owner')
    const ownerResponse = await patch(
      `${API_URL}/organizations/${slug}/members/${member.gotrue_id}`,
      { role_id: ownerRole!.id }
    )
    if (ownerResponse.error) {
      return ui.setNotification({
        category: 'error',
        message: `Failed to transfer ownership: ${ownerResponse.error.message}`,
      })
    }

    // Then change the user to the role of a developer
    const developerRole = roles.find((role) => role.name === 'Developer')
    const developerResponse = await patch(
      `${API_URL}/organizations/${slug}/members/${ui.profile!.gotrue_id}`,
      { role_id: developerRole!.id }
    )
    if (developerResponse.error) {
      return ui.setNotification({
        category: 'error',
        message: `Failed to transfer ownership: ${ownerResponse.error.message}`,
      })
    }

    const updatedMembers = PageState.members.map((m: Member) => {
      if (m.gotrue_id === member.gotrue_id) return { ...m, role_ids: [ownerRole!.id] }
      else return member
    })
    mutateOrgMembers(updatedMembers)
    ui.setNotification({
      category: 'success',
      message: `Successfully transferred organization ownership to ${getUserDisplayName(member)}`,
    })
    setLoading(false)
  }

  async function handleResendInvite(member: Member) {
    setLoading(true)

    const response = await post(`${API_URL}/organizations/${slug}/members/invite`, {
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

  async function handleRevokeInvitation(member: Member) {
    setLoading(true)

    const invitedId = member.invited_id
    if (!invitedId) return

    const response = await delete_(
      `${API_URL}/organizations/${slug}/members/invite?invited_id=${invitedId}`,
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
            {!enablePermissions && !member.invited_at && (
              <>
                <Dropdown.Item onClick={() => setOwnerTransferIsVisible(!ownerTransferIsVisible)}>
                  <div className="flex flex-col">
                    <p>Make owner</p>
                    <p className="block opacity-50">Transfer ownership of "{orgName}"</p>
                  </div>
                </Dropdown.Item>
                <Dropdown.Seperator />
              </>
            )}
            {member.invited_at ? (
              <>
                <Dropdown.Item onClick={() => handleRevokeInvitation(member)}>
                  <div className="flex flex-col">
                    <p>Cancel invitation</p>
                    <p className="block opacity-50">Revoke this invitation.</p>
                  </div>
                </Dropdown.Item>
                <Dropdown.Seperator />
                <Dropdown.Item onClick={() => handleResendInvite(member)}>
                  <div className="flex flex-col">
                    <p>Resend invitation</p>
                    <p className="block opacity-50">Invites expire after 24hrs.</p>
                  </div>
                </Dropdown.Item>
              </>
            ) : (
              <Dropdown.Item icon={<IconTrash size="tiny" />} onClick={handleMemberDelete}>
                Remove member
              </Dropdown.Item>
            )}
          </>
        }
      >
        <Button
          as="span"
          type="text"
          disabled={loading}
          loading={loading}
          icon={<IconMoreHorizontal />}
        />
      </Dropdown>

      <TextConfirmModal
        title="Transfer organization"
        visible={ownerTransferIsVisible}
        confirmString={slug}
        loading={loading}
        confirmLabel="I understand, transfer ownership"
        confirmPlaceholder="Type in name of orgnization"
        onCancel={() => setOwnerTransferIsVisible(!ownerTransferIsVisible)}
        onConfirm={handleTransferOwnership}
        alert="Payment methods such as credit cards will also be transferred. You may want to delete credit card information first before transferring."
        text={
          <span>
            By transferring this organization, it will be solely owned by{' '}
            <span className="font-medium dark:text-white">{getUserDisplayName(member)}</span>, they
            will also be able to remove you from the organization as a member
          </span>
        }
      />
    </div>
  )
}

export default observer(OwnerDropdown)
