import { Button, Form, IconMail, Input, Modal, Select } from '@supabase/ui'
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
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { ui } = useStore()

  const router = useRouter()
  const { slug } = router.query

  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')

  // to do: move to a store @joshenlim
  const { data: roles, error: rolesError } = useSWR(`${API_URL}/organizations/${slug}/roles`, get)

  const initialValues = { email: '', role: '' }

  const schema = object({
    email: string().email('Must be a valid email address').required('Email is required'),
    role: string().required('Role is required'),
  })

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Invite</Button>
      <Modal
        size="small"
        className="!overflow-visible"
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        header="Invite a member to this organization"
        description="Members you'd like to invite must already be registered on Supabase"
        layout="vertical"
        hideFooter
      >
        <Modal.Content>
          <Form
            validationSchema={schema}
            initialValues={initialValues}
            onSubmit={async (values: any, resetForm: any) => {
              setLoading(true)

              const response = await post(`${API_URL}/organizations/${slug}/members/invite`, {
                invited_email: values.email.toLowerCase(),
                owner_id: toJS(user.id),
                role: values.role,
              })

              if (isNil(response)) {
                ui.setNotification({ category: 'error', message: 'Failed to add member' })
              } else if (response?.error) {
                ui.setNotification({
                  category: 'error',
                  message: `Failed to add member: ${response.error.message}`,
                })
                setLoading(false)
              } else {
                const newMember: Member = {
                  // [Joshen] Setting a random id for now to fit the Member interface
                  id: 0,
                  invited_at: response.invited_at,
                  primary_email: response.invited_email,
                  username: response.invited_email[0],
                }
                // console.log('members for addMember', members)
                // console.log('members being sent to mututa', [...toJS(members), newMember])
                mutateOrgMembers([...members, newMember])

                ui.setNotification({
                  category: 'success',
                  message: 'Successfully added new member.',
                })
                setIsOpen(!isOpen)
                resetForm({ initialValues: { ...initialValues, role: roles[0].id } })
              }
            }}
          >
            {({ resetForm }: any) => {
              /**
               * catches 'roles' when its available and then adds a default value for role select
               */
              useEffect(() => {
                if (roles) {
                  resetForm({
                    values: { ...initialValues, role: roles[0].id },
                    initialValues: { ...initialValues, role: roles[0].id },
                  })
                }
              }, [roles])

              return (
                <div className="w-full py-4">
                  <div className="space-y-4">
                    {roles && (
                      <Select name="role" label="Member role">
                        {roles.map((role: any) => (
                          <Select.Option key={role.id} value={role.id}>
                            {role.name}
                          </Select.Option>
                        ))}
                      </Select>
                    )}

                    <Input
                      id="email"
                      icon={<IconMail />}
                      autoFocus
                      placeholder="Enter email address"
                      label="Email address"
                    />

                    <Button block size="medium" htmlType="submit" loading={loading}>
                      Invite new member
                    </Button>
                  </div>
                </div>
              )
            }}
          </Form>
        </Modal.Content>
      </Modal>
    </>
  )
}
export default InviteMemberModal
