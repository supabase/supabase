import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useUserInviteMutation } from 'data/auth/user-invite-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button, Form, Input, Modal } from 'ui'

export type InviteUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const InviteUserModal = ({ visible, setVisible }: InviteUserModalProps) => {
  const { ref: projectRef } = useParams()

  const handleToggle = () => setVisible(!visible)
  const { mutate: inviteUser, isLoading: isInviting } = useUserInviteMutation({
    onSuccess: (_, variables) => {
      toast.success(`Sent invite email to ${variables.email}`)
      setVisible(false)
    },
  })
  const canInviteUsers = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'invite_user')

  const validate = (values: any) => {
    const errors: any = {}
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

    if (values.email.length === 0) {
      errors.email = 'Please enter a valid email'
    } else if (!emailValidateRegex.test(values.email)) {
      errors.email = `${values.email} is an invalid email`
    }

    return errors
  }

  const onInviteUser = async (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    inviteUser({ projectRef, email: values.email })
  }

  return (
    <div>
      <Modal
        closable
        hideFooter
        size="small"
        key="invite-user-modal"
        visible={visible}
        header="Invite a new user"
        onCancel={handleToggle}
      >
        <Form
          validateOnBlur={false}
          initialValues={{ email: '' }}
          validate={validate}
          onSubmit={onInviteUser}
        >
          {() => (
            <>
              <Modal.Content>
                <Input
                  id="email"
                  className="w-full"
                  label="User email"
                  icon={<Mail />}
                  type="email"
                  name="email"
                  placeholder="User email"
                />
              </Modal.Content>

              <Modal.Content>
                <Button
                  block
                  size="small"
                  htmlType="submit"
                  loading={isInviting}
                  disabled={!canInviteUsers || isInviting}
                >
                  Invite user
                </Button>
              </Modal.Content>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default InviteUserModal
