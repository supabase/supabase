import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import {
  Button,
  cn,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconMail,
  IconMoreHorizontal,
  IconShieldOff,
  IconTrash,
} from 'ui'

import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import { User } from 'data/auth/users-query'
import { useStore } from 'hooks'
import { timeout } from 'lib/helpers'

interface UserDropdownProps {
  user: User
  canRemoveUser: boolean
  canRemoveMFAFactors: boolean
}

const UserDropdown = ({ user, canRemoveUser, canRemoveMFAFactors }: UserDropdownProps) => {
  const { ui } = useStore()
  const { ref } = useParams()

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
        if (!user.id) return console.error('User id is required')

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
    <DropdownMenu_Shadcn_>
      <DropdownMenuTrigger_Shadcn_>
        <Button
          asChild
          type="text"
          icon={<IconMoreHorizontal />}
          loading={isLoading}
          className="hover:border-gray-500 flex"
        >
          <span />
        </Button>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_>
        <>
          {user.email !== null ? (
            <>
              <DropdownMenuItem_Shadcn_ className="space-x-2" onClick={handleResetPassword}>
                <IconMail size="tiny" />
                <p className="text">Send password recovery</p>
              </DropdownMenuItem_Shadcn_>
              <DropdownMenuItem_Shadcn_ className="space-x-2" onClick={handleSendMagicLink}>
                <IconMail size="tiny" />
                <p className="text">Send magic link</p>
              </DropdownMenuItem_Shadcn_>
            </>
          ) : null}
          {user.phone !== null ? (
            <DropdownMenuItem_Shadcn_ className="space-x-2" onClick={handleSendOtp}>
              <IconMail size="tiny" />
              <p className="text">Send OTP</p>
            </DropdownMenuItem_Shadcn_>
          ) : null}
          <DropdownMenuSeparator_Shadcn_ />
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <DropdownMenuItem_Shadcn_
                onClick={handleDeleteFactors}
                disabled={!canRemoveMFAFactors}
                className="space-x-2"
              >
                <IconShieldOff size="tiny" />
                <p className="text">Remove MFA factors</p>
              </DropdownMenuItem_Shadcn_>
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
                    <span className="text-xs text-foreground">
                      You need additional permissions to remove a user's authentication factors.
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <DropdownMenuItem_Shadcn_
                onClick={handleDelete}
                disabled={!canRemoveUser}
                className="space-x-2"
              >
                <IconTrash size="tiny" />
                <p className="text">Delete user</p>
              </DropdownMenuItem_Shadcn_>
            </Tooltip.Trigger>
            {!canRemoveUser && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={cn([
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ])}
                  >
                    <span className="text-xs text-foreground">
                      You need additional permissions to delete users
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  )
}

export default UserDropdown
