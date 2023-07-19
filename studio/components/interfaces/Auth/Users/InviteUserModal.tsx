import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useContext } from 'react'
import { Button, Form, IconMail, Input, Modal } from 'ui'

import { useParams } from 'common'
import { useUserInviteMutation } from 'data/auth/user-invite-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { PageContext } from 'pages/project/[ref]/auth/users'

export type InviteUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const InviteUserModal = ({ visible, setVisible }: InviteUserModalProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const PageState: any = useContext(PageContext)

  const handleToggle = () => setVisible(!visible)
  const { mutateAsync: inviteUser, isLoading: isInviting } = useUserInviteMutation()
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
    if (!ref) return console.error('Project ref is required')

    await inviteUser({ projectRef: ref, email: values.email })
    PageState.fetchData(1)
    ui.setNotification({ category: 'success', message: `Sent invite email to ${values.email}` })
    setVisible(false)
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
            <div className="space-y-6 py-4">
              <Modal.Content>
                <Input
                  id="email"
                  className="w-full"
                  label="User email"
                  icon={<IconMail />}
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
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default observer(InviteUserModal)
