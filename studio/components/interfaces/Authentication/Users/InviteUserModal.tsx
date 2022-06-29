import { useContext, useState, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Modal, Input, IconPlus, IconMail } from '@supabase/ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { PageContext } from 'pages/project/[ref]/auth/users'

const InviteUserModal = () => {
  const PageState: any = useContext(PageContext)
  const inputRef = useRef<any>(null)
  const { ui } = useStore()

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailValue, setEmailValue] = useState('')

  function handleToggle() {
    // reset data before showing modal again
    if (!visible) {
      setEmailValue('')
    }
    setVisible(!visible)
  }

  function onInputChange(e: any) {
    setEmailValue(e.target.value)
  }

  async function onInviteUser() {
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    if (!emailValidateRegex.test(emailValue)) {
      inputRef?.current?.focus()
      const message =
        emailValue.trim() === ''
          ? 'Please enter a valid email'
          : `${emailValue} is an invalid email`
      ui.setNotification({ category: 'error', message: message })
      return
    }

    setLoading(true)
    const response = await post(`${API_URL}/auth/${PageState.projectRef}/invite`, {
      email: emailValue,
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
        message: `Sent invite email to ${emailValue}`,
      })
    }

    setLoading(false)
    setVisible(false)
  }

  return (
    <div>
      <Button onClick={handleToggle} icon={<IconPlus />}>
        Invite
      </Button>
      <Modal
        size="small"
        key="invite-user-modal"
        visible={visible}
        header="Invite new user"
        hideFooter
        onCancel={handleToggle}
        closable
      >
        <div className="py-4 space-y-6">
          <Modal.Content>
            <Input
              label="User email"
              icon={<IconMail />}
              descriptionText="Type in the full email address"
              autoFocus
              // @ts-ignore
              ref={inputRef}
              value={emailValue}
              onChange={onInputChange}
              type="email"
              name="email"
              id="email"
              placeholder="User email"
              className="w-full"
            />
          </Modal.Content>
          <Modal.Content>
            <Button onClick={onInviteUser} size="small" loading={loading} disabled={loading} block>
              Invite user
            </Button>
          </Modal.Content>
        </div>
      </Modal>
    </div>
  )
}

export default observer(InviteUserModal)
