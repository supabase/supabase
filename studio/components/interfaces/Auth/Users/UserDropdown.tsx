import * as Tooltip from '@radix-ui/react-tooltip'
import { observer } from 'mobx-react-lite'
import { useContext } from 'react'
import { Button, Dropdown, IconMail, IconMoreHorizontal, IconShieldOff, IconTrash } from 'ui'

import { useParams } from 'common'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import { useStore } from 'hooks'
import { timeout } from 'lib/helpers'
import { PageContext } from 'pages/project/[ref]/auth/users'
import { User } from './Users.types'

interface UserDropdownProps {
  user: User
  canRemoveUser: boolean
  canRemoveMFAFactors: boolean
}

const UserDropdown = ({ user, canRemoveUser, canRemoveMFAFactors }: UserDropdownProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const PageState: any = useContext(PageContext)

  const { mutate: resetPassword, isLoading: isResetting } = useUserResetPasswordMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Sent password recovery to ${user.email}`,
      })
    },
  })
  const { mutate: sendMagicLink, isLoading: isSendingLink } = useUserSendMagicLinkMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Sent magic link to ${user.email}`,
      })
    },
  })
  const { mutate: sendOTP, isLoading: isSendingOTP } = useUserSendOTPMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Sent OTP to ${user.phone}`,
      })
    },
  })
  const { mutateAsync: deleteUser, isLoading: isDeleting } = useUserDeleteMutation()
  const { mutateAsync: deleteUserMFAFactors, isLoading: isDeletingFactors } =
    useUserDeleteMFAFactorsMutation()
  const isLoading = isResetting || isSendingLink || isSendingOTP || isDeleting || isDeletingFactors

  const handleResetPassword = async () => {
    if (!ref) return console.error('Project ref is required')
    resetPassword({ projectRef: ref, user })
  }

  async function handleSendMagicLink() {
    if (!ref) return console.error('Project ref is required')
    sendMagicLink({ projectRef: ref, user })
  }

  async function handleSendOtp() {
    if (!ref) return console.error('Project ref is required')
    sendOTP({ projectRef: ref, user })
  }

  async function handleDelete() {
    await timeout(200)
    confirmAlert({
      title: 'Confirm to delete',
      message: `This is permanent! Are you sure you want to delete user ${user.email} ?`,
      onAsyncConfirm: async () => {
        if (!ref) return console.error('Project ref is required')
        try {
          await deleteUser({ projectRef: ref, user })
          ui.setNotification({ category: 'success', message: `Successfully deleted ${user.email}` })
          PageState.users = PageState.users.filter((x: any) => x.id != user.id)
          PageState.totalUsers -= 1
        } catch (error) {}
      },
    })
  }

  async function handleDeleteFactors() {
    await timeout(200)
    confirmAlert({
      title: 'Confirm to delete',
      message: `This is permanent! Are you sure you want to delete the user's MFA factors?`,
      onAsyncConfirm: async () => {
        if (!ref) return console.error('Project ref is required')
        try {
          await deleteUserMFAFactors({ projectRef: ref, userId: user.id })
          ui.setNotification({
            category: 'success',
            message: "Successfully deleted the user's factors",
          })
        } finally {
        }
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
            <Tooltip.Trigger asChild>
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
              <Tooltip.Portal>
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
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <Dropdown.Item
                onClick={handleDelete}
                icon={<IconTrash size="tiny" />}
                disabled={!canRemoveUser}
              >
                Delete user
              </Dropdown.Item>
            </Tooltip.Trigger>
            {!canRemoveUser && (
              <Tooltip.Portal>
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
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </>
      }
    >
      <Button
        asChild
        type="text"
        icon={<IconMoreHorizontal />}
        loading={isLoading}
        className="hover:border-gray-500"
      >
        <span />
      </Button>
    </Dropdown>
  )
}

export default observer(UserDropdown)
