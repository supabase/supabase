import { createContext, useState, useEffect } from 'react'
import { isNil } from 'lodash'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { post } from 'lib/common/fetch'
import { Button, IconKey, IconMail, Input } from '@supabase/ui'
import { Modal } from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { useOrganizationDetail, useStore } from 'hooks'
import { toJS } from 'mobx'
import { Member } from 'types'

/**
 * Endpoints (delete when finished)
 *
 * Delete invite
 * curl -X DELETE "http://localhost:8080/platform/organizations/:slug/members/invite?invited_id=:id" -H "Authorization: Bearer access_token_jwt"
 *
 * Get all pending invites
 * curl -X GET "http://localhost:8080/platform/organizations/:slug/members/invite" -H "Authorization: Bearer access_token_jwt"
 *
 * Send an invitation
 * curl -X POST "http://localhost:8080/platform/organizations/slug/members/invite" -H "Content-Type: application/json" -d '{"invited_email": "", "owner_id": ""}' -H "Authorization: Bearer ..."
 *
 * Verify an invitation
 * curl -X GET 'http://localhost:8080/platform/organizations/slug/members/join?token=XXX'
 *
 */

/**
 * Modal to invite member to Organization
 *
 * @param {Object}          organization          // organization detail
 * @param {Array}           members               // organization members list
 * @param {Object}          user                  // current user detail
 */

const PageContext = createContext(null)

function InviteMemberModal({ organization, members = [], user }: any) {
  const PageState = useLocalObservable(() => ({
    members: [],
    addMemberLoading: false,
    emailAddress: '',
    emailIsValid() {
      return String(this.emailAddress)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    },
  }))
  const { ui } = useStore()
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')
  const [isOpen, setIsOpen] = useState(false)
  const { id: orgId, slug: orgSlug } = organization

  useEffect(() => {
    PageState.members = members
  }, [members])

  function toggle() {
    // reset data before showing modal again
    if (!isOpen) {
      PageState.addMemberLoading = false
      PageState.emailAddress = ''
    }
    setIsOpen(!isOpen)
  }

  async function addMember() {
    PageState.addMemberLoading = true

    const response = await post(`${API_URL}/organizations/${orgSlug}/members/invite`, {
      invited_email: PageState.emailAddress,
      owner_id: toJS(user.id),
    })
    if (isNil(response)) {
      ui.setNotification({ category: 'error', message: 'Failed to add member' })
    } else if (response?.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to add member: ${response.error.message}`,
      })
      PageState.addMemberLoading = false
    } else {
      const newMember: Member = {
        // [Joshen] Setting a random id for now to fit the Member interface
        id: 0,
        invited_at: response.invited_at,
        is_owner: false,
        profile: {
          id: 0,
          primary_email: response.invited_email,
          username: response.invited_email[0],
        },
      }
      mutateOrgMembers([...PageState.members, newMember])

      ui.setNotification({ category: 'success', message: 'Successfully added new member.' })
      toggle()
    }
  }

  function onEmailInputChange(e: any) {
    PageState.emailAddress = e.target.value
  }

  return (
    <PageContext.Provider value={PageState}>
      <Button onClick={toggle}>Invite</Button>
      <Modal
        size="small"
        className="!overflow-visible"
        icon={<IconKey size="xlarge" background="brand" />}
        visible={isOpen}
        onCancel={toggle}
        header="Invite a member to this organization"
        description="Members you'd like to invite must already be registered on Supabase"
        layout="vertical"
        hideFooter
      >
        <div className="w-full space-y-4 py-4">
          <Modal.Content>
            <div className="text-center">
              <Input
                icon={<IconMail />}
                autoFocus
                id="email"
                placeholder="Enter email address"
                onChange={onEmailInputChange}
                value={PageState.emailAddress}
                className="w-full"
              />
            </div>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="">
              <Button
                onClick={addMember}
                loading={PageState.addMemberLoading}
                disabled={!PageState.emailIsValid()}
                block
              >
                Invite new member
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </PageContext.Provider>
  )
}
export default observer(InviteMemberModal)
