import { useContext, useState, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'react-hot-toast'
import { Button, Modal, Input, IconPlus, IconMail } from '@supabase/ui'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { PageContext } from 'pages/project/[ref]/auth/users'

const InviteUserModal = () => {
  const PageState: any = useContext(PageContext)
  const inputRef = useRef(null)
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
      // focus input
      ;(inputRef?.current as any)?.focus()
      // show error
      let message = `${emailValue} is an invalid email`
      if (emailValue.trim() == '') message = 'Please enter a valid email'
      toast.error(message)
      return
    }

    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/invite`, {
        email: emailValue,
      })
      if (response.error) {
        toast.error(`Inviting user failed: ${response.error.message}`)
      } else {
        PageState.fetchData(1)
        toast(`Sent invite email to ${emailValue}`)
      }
    } catch (error) {
      console.error('onInviteUser error:', error)
      toast.error(`Inviting user failed`)
    } finally {
      setLoading(false)
      setVisible(false)
    }
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
        title="Invite new user"
        hideFooter
        onCancel={handleToggle}
        closable
      >
        <Input
          label="User email"
          icon={<IconMail />}
          autoFocus
          // @ts-ignore
          ref={inputRef}
          value={emailValue}
          onChange={onInputChange}
          type="text"
          name="email"
          id="email"
          placeholder="User email"
          className="w-full"
        />

        <Button onClick={onInviteUser} loading={loading} disabled={loading} block>
          Invite user
        </Button>
      </Modal>
    </div>
  )
}

export default observer(InviteUserModal)
