import { Button, Form, IconMail, Input, Listbox, Modal } from '@supabase/ui'
import { useOrganizationDetail, useStore } from 'hooks'
import { get, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { isNil } from 'lodash'
import { toJS } from 'mobx'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Member } from 'types'
import { object, string } from 'yup'

function InviteMemberModal({ organization, members = [], user }: any) {
  const initialValues = { email: '' }
  const { ui } = useStore()
  const router = useRouter()
  const { slug } = router.query
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')
  const [isOpen, setIsOpen] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [memberList, setMemberList] = useState<Member[]>([])
  const [addMemberLoading, setAddMemberLoading] = useState(false)

  const { slug: orgSlug } = organization

  useEffect(() => {
    setMemberList(members)
  }, [members])

  function toggle() {
    // reset data before showing modal again
    if (!isOpen) {
      setAddMemberLoading(false)
      setEmailAddress('')
    }
    setIsOpen(!isOpen)
  }

  async function addMember() {
    setAddMemberLoading(true)

    const response = await post(`${API_URL}/organizations/${orgSlug}/members/invite`, {
      invited_email: emailAddress.toLowerCase(),
      owner_id: toJS(user.id),
    })

    if (isNil(response)) {
      ui.setNotification({ category: 'error', message: 'Failed to add member' })
    } else if (response?.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to add member: ${response.error.message}`,
      })
      setAddMemberLoading(false)
    } else {
      const newMember: Member = {
        // [Joshen] Setting a random id for now to fit the Member interface
        id: 0,
        invited_at: response.invited_at,
        primary_email: response.invited_email,
        username: response.invited_email[0],
      }

      mutateOrgMembers([...memberList, newMember])

      ui.setNotification({
        category: 'success',
        message: 'Successfully added new member.',
      })
      toggle()
    }
  }

  function onEmailInputChange(e: any) {
    setEmailAddress(e.target.value)
  }

  const schema = object({
    email: string().email('Must be a valid email address').required('Email is required'),
  })

  const { data: roles, error: rolesError } = useSWR(`${API_URL}/organizations/${slug}/roles`, get)

  return (
    <>
      <Button onClick={toggle}>Invite</Button>
      <Modal
        size="small"
        className="!overflow-visible"
        visible={isOpen}
        onCancel={toggle}
        header="Invite a member to this organization"
        description="Members you'd like to invite must already be registered on Supabase"
        layout="vertical"
        hideFooter
      >
        <Modal.Content>
          <Form validationSchema={schema} initialValues={initialValues} onSubmit={addMember}>
            {() => (
              <div className="w-full py-4">
                <div className="space-y-4">
                  {roles && (
                    <Listbox
                      label="Member role"
                      value={roles[0].id}
                      // onChange={(roleId) => {
                      //   setUserRoleChangeModalVisible(true)
                      //   setSelectedUser({
                      //     ...x,
                      //     oldRoleId: activeRoleId,
                      //     newRoleId: roleId,
                      //   })
                      // }}
                    >
                      {roles.map((role: any) => (
                        <Listbox.Option key={role.id} value={role.id} label={role.name}>
                          {role.name}
                        </Listbox.Option>
                      ))}
                    </Listbox>
                  )}

                  <Input
                    id="email"
                    icon={<IconMail />}
                    autoFocus
                    placeholder="Enter email address"
                    onChange={onEmailInputChange}
                    label="Email address"
                  />

                  <Button block size="medium" htmlType="submit" loading={addMemberLoading}>
                    Invite new member
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </Modal.Content>
      </Modal>
    </>
  )
}
export default InviteMemberModal
