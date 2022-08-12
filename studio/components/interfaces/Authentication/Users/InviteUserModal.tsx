import { useContext, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Modal, Input, IconPlus, IconMail, Form } from '@supabase/ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { PageContext } from 'pages/project/[ref]/auth/users'

const InviteUserModal = () => {
  const { ui } = useStore()
  const PageState: any = useContext(PageContext)
  const [visible, setVisible] = useState(false)

  const handleToggle = () => setVisible(!visible)

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

  const onInviteuser = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)

    const response = await post(`${API_URL}/auth/${PageState.projectRef}/invite`, {
      email: values.email,
    })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to invite user: ${response.error.message}`,
      })
    } else {
      PageState.fetchData(1)
      ui.setNotification({
        category: 'success',
        message: `Sent invite email to ${values.email}`,
      })
      setVisible(false)
    }

    setSubmitting(false)
  }

  return (
    <div>
      <Button onClick={handleToggle} icon={<IconPlus />}>
        Invite
      </Button>
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
          validateOnBlur
          initialValues={{ email: '' }}
          validate={validate}
          onSubmit={onInviteuser}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <div className="py-4 space-y-6">
              <Modal.Content>
                <Input
                  autoFocus
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
                  loading={isSubmitting}
                  disabled={isSubmitting}
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
