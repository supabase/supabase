import { isNil } from 'lodash'
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
import { object, string } from 'yup'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Form, IconMail, Input, Modal, Select } from 'ui'

import { Member, User, Role } from 'types'
import { checkPermissions, useOrganizationDetail, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface Props {
  user: User
  members: Member[]
  roles: Role[]
  rolesAddable: Number[]
}

const InviteMemberButton: FC<Props> = ({ user, members = [], roles = [], rolesAddable = [] }) => {
  const { ui } = useStore()
  const router = useRouter()
  const { slug } = router.query

  const [isOpen, setIsOpen] = useState(false)
  const { mutateOrgMembers } = useOrganizationDetail((slug as string) || '')

  const canInviteMembers = roles.some(({ id: role_id }) =>
    checkPermissions(PermissionAction.CREATE, 'user_invites', { resource: { role_id } })
  )

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

    const roleId = Number(values.role)

    setSubmitting(true)

    const response = await post(`${API_URL}/organizations/${slug}/members/invite`, {
      invited_email: values.email.toLowerCase(),
      owner_id: user.id,
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
        role_ids: [response.role_id],
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
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button disabled={!canInviteMembers} onClick={() => setIsOpen(true)}>
            Invite
          </Button>
        </Tooltip.Trigger>
        {!canInviteMembers && (
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">
                You need additional permissions to invite a member to this organization
              </span>
            </div>
          </Tooltip.Content>
        )}
      </Tooltip.Root>
      <Modal
        hideFooter
        size="medium"
        layout="vertical"
        className="!overflow-visible"
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        header="Invite a member to this organization"
      >
        <Form validationSchema={schema} initialValues={initialValues} onSubmit={onInviteMember}>
          {({ values, isSubmitting, resetForm }: any) => {
            // Catches 'roles' when its available and then adds a default value for role select
            useEffect(() => {
              if (roles) {
                resetForm({
                  values: {
                    ...initialValues,
                    role: roles.find((role) => role.name === 'Developer')?.id,
                  },
                  initialValues: {
                    ...initialValues,
                    role: roles.find((role) => role.name === 'Developer')?.id,
                  },
                })
              }
            }, [roles])

            const selectedRole = roles.find((role) => role.id === Number(values.role))
            const invalidRoleSelected = values.role && !rolesAddable.includes(Number(values.role))

            return (
              <>
                <Modal.Content>
                  <div className="w-full py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {roles && (
                          <Select
                            id="role"
                            name="role"
                            label="Member role"
                            error={
                              invalidRoleSelected
                                ? `You need additional permissions to assign users the role of ${selectedRole?.name}`
                                : ''
                            }
                          >
                            {roles.map((role: any) => (
                              <Select.Option key={role.id} value={role.id}>
                                {role.name}
                              </Select.Option>
                            ))}
                          </Select>
                        )}
                      </div>

                      <Input
                        autoFocus
                        id="email"
                        icon={<IconMail />}
                        placeholder="Enter email address"
                        label="Email address"
                      />
                    </div>
                  </div>
                </Modal.Content>
                <Modal.Separator />
                <Modal.Content>
                  <div className="pt-2 pb-3">
                    <Button
                      block
                      size="medium"
                      htmlType="submit"
                      disabled={isSubmitting || invalidRoleSelected}
                      loading={isSubmitting}
                    >
                      Invite new member
                    </Button>
                  </div>
                </Modal.Content>
              </>
            )
          }}
        </Form>
      </Modal>
    </>
  )
}
export default InviteMemberButton
