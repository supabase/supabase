import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import { useState } from 'react'

import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import { User } from 'data/auth/users-query'
import { useStore } from 'hooks'
import { timeout } from 'lib/helpers'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconMail,
  IconMoreHorizontal,
  IconShieldOff,
  IconTrash,
  Modal,
} from 'ui'

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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  async function handleDelete() {
    await timeout(200)

    if (!ref) return console.error('Project ref is required')
    try {
      await deleteUser({ projectRef: ref, user })
      ui.setNotification({ category: 'success', message: `Successfully deleted ${user.email}` })
      setIsDeleteModalOpen(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: error?.message ?? 'Something went wrong while trying to delete user',
      })
    }
  }

  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  async function handleDeleteFactors() {
    await timeout(200)

    if (!ref) return console.error('Project ref is required')
    if (!user.id) return console.error('User id is required')

    try {
      await deleteUserMFAFactors({ projectRef: ref, userId: user.id })
      ui.setNotification({
        category: 'success',
        message: "Successfully deleted the user's factors",
      })
      setIsDeleteFactorsModalOpen(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: error?.message ?? "Something went wrong while trying to delete user's factors",
      })
    } finally {
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            asChild
            type="text"
            icon={<IconMoreHorizontal />}
            loading={isLoading}
            className="hover:border-gray-500 flex"
          >
            <span />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <>
            {user.email !== null ? (
              <>
                <DropdownMenuItem className="space-x-2" onClick={handleResetPassword}>
                  <IconMail size="tiny" />
                  <p>Send password recovery</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="space-x-2" onClick={handleSendMagicLink}>
                  <IconMail size="tiny" />
                  <p>Send magic link</p>
                </DropdownMenuItem>
              </>
            ) : null}
            {user.phone !== null ? (
              <DropdownMenuItem className="space-x-2" onClick={handleSendOtp}>
                <IconMail size="tiny" />
                <p>Send OTP</p>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <DropdownMenuItem
                  onClick={() => {
                    setIsDeleteFactorsModalOpen(true)
                  }}
                  disabled={!canRemoveMFAFactors}
                  className="space-x-2"
                >
                  <IconShieldOff size="tiny" />
                  <p>Remove MFA factors</p>
                </DropdownMenuItem>
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
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
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
                <DropdownMenuItem
                  onClick={() => {
                    setIsDeleteModalOpen(true)
                  }}
                  disabled={!canRemoveUser}
                  className="space-x-2"
                >
                  <IconTrash size="tiny" />
                  <p>Delete user</p>
                </DropdownMenuItem>
              </Tooltip.Trigger>
              {!canRemoveUser && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={cn([
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
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
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        header="Confirm to delete"
        buttonLabel="Delete"
        onSelectCancel={() => setIsDeleteModalOpen(false)}
        onSelectConfirm={() => {
          handleDelete()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            This is permanent! Are you sure you want to delete user {user.email}?
          </p>
        </Modal.Content>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isDeleteFactorsModalOpen}
        header="Confirm to delete"
        buttonLabel="Delete"
        onSelectCancel={() => setIsDeleteFactorsModalOpen(false)}
        onSelectConfirm={() => {
          handleDeleteFactors()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            This is permanent! Are you sure you want to delete the user's MFA factors?
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default UserDropdown
