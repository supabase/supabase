import { FC, useContext, useState } from 'react'
import { toast } from 'react-hot-toast'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, Divider, IconTrash, IconMail, IconMoreHorizontal } from '@supabase/ui'

import { timeout } from 'lib/helpers'
import { post, delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { PageContext } from 'pages/project/[ref]/auth/users'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

const UserDropdown: FC<{ user: any }> = ({ user }) => {
  const PageState: any = useContext(PageContext)
  const [loading, setLoading] = useState(false)

  async function handleResetPassword() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/recover`, user)
      if (response.error) {
        toast.error(`Send password recovery failed: ${response.error.message}`)
      } else {
        toast(`Sent password recovery to ${user.email}`)
      }
    } catch (error) {
      console.error('handleResetPassword error:', error)
      toast.error(`Send password recovery failed`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMagicLink() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/magiclink`, user)
      if (response.error) {
        toast.error(`Sending magic link failed: ${response.error.message}`)
      } else {
        toast(`Sent magic link to ${user.email}`)
      }
    } catch (error) {
      console.error('handleSendMagicLink error:', error)
      toast.error(`Sending magic link failed`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/otp`, user)
      if (response.error) {
        toast.error(`Sending OTP failed: ${response.error.message}`)
      } else {
        toast(`Sent OTP to ${user.phone}`)
      }
    } catch (error) {
      console.error('handleSendOtp error:', error)
      toast.error(`Sending OTP failed`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    await timeout(200)

    confirmAlert({
      title: 'Confirm to delete',
      message: `This is permanent! Are you sure you want to delete user ${user.email} ?`,
      onAsyncConfirm: async () => {
        setLoading(true)
        const response = await delete_(`${API_URL}/auth/${PageState.projectRef}/users`, user)
        if (response.error) {
          toast.error(`Deleting user failed: ${response.error.message}`)
        } else {
          toast(`User ${user.email} deleted`)
          PageState.users = PageState.users.filter((x: any) => x.id != user.id)
        }
        setLoading(false)
      },
    })
  }

  return (
    <Dropdown
      overlay={
        <>
          {user.email !== null ? (
            <>
              <Dropdown.Item onClick={handleResetPassword} icon={<IconMail size="tiny" />}>
                Send password recovery
              </Dropdown.Item>
              <Dropdown.Item onClick={handleSendMagicLink} icon={<IconMail size="tiny" />}>
                Send magic link
              </Dropdown.Item>
            </>
          ) : null}
          {user.phone !== null ? (
            <Dropdown.Item onClick={handleSendOtp} icon={<IconMail size="tiny" />}>
              Send OTP
            </Dropdown.Item>
          ) : null}
          <Divider light />
          <Dropdown.Item onClick={handleDelete} icon={<IconTrash size="tiny" />}>
            Delete user
          </Dropdown.Item>
        </>
      }
    >
      <Button
        as="span"
        type="text"
        icon={<IconMoreHorizontal />}
        loading={loading}
        className="hover:border-gray-500"
      />
    </Dropdown>
  )
}

export default observer(UserDropdown)
