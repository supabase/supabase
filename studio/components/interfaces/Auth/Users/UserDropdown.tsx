import { FC, useContext, useState } from 'react'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Dropdown, IconTrash, IconMail, IconMoreHorizontal, IconShieldOff } from 'ui'

import { useStore } from 'hooks'
import { timeout } from 'lib/helpers'
import { post, delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { PageContext } from 'pages/project/[ref]/auth/users'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { User } from './Users.types'

interface Props {
  user: User
  canRemoveUser: boolean
  canRemoveMFAFactors: boolean
}

const UserDropdown: FC<Props> = ({ user, canRemoveUser, canRemoveMFAFactors }) => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const [loading, setLoading] = useState<boolean>(false)

  async function handleResetPassword() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/recover`, user)
      if (response.error) {
        ui.setNotification({
          category: 'error',
          message: `Failed to send password recovery: ${response.error.message}`,
        })
      } else {
        ui.setNotification({
          category: 'success',
          message: `Sent password recovery to ${user.email}`,
        })
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Send password recovery failed: ${error?.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMagicLink() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/magiclink`, user)
      if (response.error) {
        ui.setNotification({
          category: 'error',
          message: `Failed to send magic link: ${response.error.message}`,
        })
      } else {
        ui.setNotification({
          category: 'success',
          message: `Sent magic link to ${user.email}`,
        })
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to send magic link: ${error?.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/otp`, user)
      if (response.error) {
        ui.setNotification({
          category: 'error',
          message: `Failed to OTP: ${response.error.message}`,
        })
      } else {
        ui.setNotification({
          category: 'success',
          message: `Sent OTP to ${user.phone}`,
        })
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to send OTP: ${error?.message}`,
      })
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
          ui.setNotification({
            category: 'error',
            message: `Failed to delete user: ${response.error.message}`,
          })
        } else {
          ui.setNotification({ category: 'success', message: `Successfully deleted ${user.email}` })
          PageState.users = PageState.users.filter((x: any) => x.id != user.id)
          PageState.totalUsers -= 1
        }
        setLoading(false)
      },
    })
  }

  async function handleDeleteFactors() {
    await timeout(200)

    confirmAlert({
      title: 'Confirm to delete',
      message: `This is permanent! Are you sure you want to delete the user's MFA factors?`,
      onAsyncConfirm: async () => {
        setLoading(true)
        const response = await delete_(
          `${API_URL}/auth/${PageState.projectRef}/users/${user.id}/factors`
        )
        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to delete factors: ${response.error.message}`,
          })
        } else {
          ui.setNotification({
            category: 'success',
            message: "Successfully deleted the user's factors",
          })
        }
        setLoading(false)
      },
    })
  }

  return (
    <Dropdown
      size="medium"
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
          <Dropdown.Separator />
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-full">
              <Dropdown.Item
                onClick={handleDeleteFactors}
                icon={<IconShieldOff size="tiny" />}
                disabled={!canRemoveMFAFactors}
              >
                Remove MFA factors
              </Dropdown.Item>
            </Tooltip.Trigger>
            {/* 
                [Joshen] Deleting MFA factors should be different ABAC perms i think
                 need to double check with KM / anyone familiar with ABAC 
              */}
            {!canRemoveMFAFactors && (
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">
                    You need additional permissions to remove a user's authentication factors.
                  </span>
                </div>
              </Tooltip.Content>
            )}
          </Tooltip.Root>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-full">
              <Dropdown.Item
                onClick={handleDelete}
                icon={<IconTrash size="tiny" />}
                disabled={!canRemoveUser}
              >
                Delete user
              </Dropdown.Item>
            </Tooltip.Trigger>
            {!canRemoveUser && (
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">
                    You need additional permissions to delete users
                  </span>
                </div>
              </Tooltip.Content>
            )}
          </Tooltip.Root>
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
