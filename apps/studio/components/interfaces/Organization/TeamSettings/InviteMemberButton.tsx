import * as Tooltip from '@radix-ui/react-tooltip'
import { isNil } from 'lodash'
import { useEffect, useState } from 'react'
import { object, string } from 'yup'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common/hooks'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { doPermissionsCheck, useGetPermissions, useStore } from 'hooks'
import { Member, Role } from 'types'
import { Button, Form, IconMail, Input, Listbox, Modal } from 'ui'

export interface InviteMemberButtonProps {
  orgId: number
  userId: number
  members: Member[]
  roles: Role[]
  rolesAddable: Number[]
}

const InviteMemberButton = ({
  orgId,
  userId,
  members = [],
  roles = [],
  rolesAddable = [],
}: InviteMemberButtonProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const { permissions: allPermissions } = useGetPermissions()

  const canInviteMembers = roles.some(({ id: role_id }) =>
    doPermissionsCheck(
      allPermissions,
      PermissionAction.CREATE,
      'user_invites',
      { resource: { role_id } },
      orgId
    )
  )

  const initialValues = { email: '', role: '' }
  const schema = object({
    email: string().email('Must be a valid email address').required('Email is required'),
    role: string().required('Role is required'),
  })

  const { mutateAsync: inviteMember, isLoading: isInviting } =
    useOrganizationMemberInviteCreateMutation()

  const onInviteMember = async (values: any, { resetForm }: any) => {
    if (!slug) {
      throw new Error('slug is required')
    }

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

    try {
      const response = await inviteMember({
        slug,
        invitedEmail: values.email.toLowerCase(),
        ownerId: userId,
        roleId,
      })
      if (isNil(response)) {
        ui.setNotification({ category: 'error', message: 'Failed to add member' })
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully added new member.' })
        setIsOpen(!isOpen)
        resetForm({ initialValues: { ...initialValues, role: roleId } })
      }
    } catch (error) {}
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <Button disabled={!canInviteMembers} onClick={() => setIsOpen(true)}>
            Invite
          </Button>
        </Tooltip.Trigger>
        {!canInviteMembers && (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  You need additional permissions to invite a member to this organization
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
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
          {({ values, resetForm }: any) => {
            // [Alaister] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              // Catches 'roles' when its available and then adds a default value for role select
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
                          <Listbox
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
                              <Listbox.Option key={role.id} value={role.id} label={role.name}>
                                {role.name}
                              </Listbox.Option>
                            ))}
                          </Listbox>
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
                      disabled={isInviting || invalidRoleSelected}
                      loading={isInviting}
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
