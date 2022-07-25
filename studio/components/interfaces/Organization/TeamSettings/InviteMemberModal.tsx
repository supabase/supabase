import { isNil } from 'lodash'
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
import { object, string } from 'yup'
import { Button, Form, IconMail, Input, Modal, Select } from '@supabase/ui'

import { Member, User } from 'types'
import { useOrganizationDetail, useOrganizationRoles, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

interface Props {
  members: Member[]
  user: User
}

const InviteMemberModal: FC<Props> = ({ members = [], user }) => {
  const { ui } = useStore()
  const router = useRouter()
  const { slug } = router.query

  const [isOpen, setIsOpen] = useState(false)

  const { roles } = useOrganizationRoles((slug as string) || '')
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')

  const initialValues = { email: '', role: '' }

  const schema = object({
    email: string().email('Must be a valid email address').required('Email is required'),
    role: string().required('Role is required'),
  })

  const onInviteMember = async (values: any, { setSubmitting, resetForm }: any) => {
    const existingMember = members.find(
      (member) => member.primary_email === values.email.toLowerCase()
    )
    if (existingMember !== undefined) {
      if (existingMember.invited_id) {
        return ui.setNotification({
          category: 'info',
          message: 'User has already been invited to this organization',
        })
      } else {
        return ui.setNotification({
          category: 'info',
          message: 'User is already in this organization',
        })
      }
    }

    setSubmitting(true)

    const developerRole = roles.find((role) => role.name === 'Developer')
    const roleId = developerRole?.id ?? roles[0].id
    const response = await post(`${API_URL}/organizations/${slug}/members/invite`, {
      invited_email: values.email.toLowerCase(),
      owner_id: user.id,
      // [Joshen TODO] to be based on selected role when roles management is completed.
      // Defaulting to Developer for now
      role_id: roleId,
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to add member: ${response.error.message}`,
      })
    } else if (isNil(response)) {
      ui.setNotification({ category: 'error', message: 'Failed to add member' })
    } else {
      const newMember: Member = {
        id: 0,
        invited_id: response.invited_id,
        invited_at: response.invited_at,
        primary_email: response.invited_email,
        username: response.invited_email[0],
        role_ids: [roleId],
      }
      mutateOrgMembers([...members, newMember])
      ui.setNotification({ category: 'success', message: 'Successfully added new member.' })

      setIsOpen(!isOpen)
      resetForm({ initialValues: { ...initialValues, role: roleId } })
    }

    setSubmitting(false)
  }

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
          <Form validationSchema={schema} initialValues={initialValues} onSubmit={onInviteMember}>
            {({ isSubmitting, resetForm }: any) => {
              // Catches 'roles' when its available and then adds a default value for role select
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
                    {/* [Joshen TODO] Commented out for now until roles management is completed */}
                    {/* {roles && (
                      <Select name="role" label="Member role">
                        {roles.map((role: any) => (
                          <Select.Option key={role.id} value={role.id}>
                            {role.name}
                          </Select.Option>
                        ))}
                      </Select>
                    )} */}

                    <Input
                      autoFocus
                      id="email"
                      icon={<IconMail />}
                      placeholder="Enter email address"
                      label="Email address"
                    />

                    <Button
                      block
                      size="medium"
                      htmlType="submit"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    >
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
