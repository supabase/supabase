import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import type { User } from 'data/auth/users-query'
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
  IconMoreVertical,
  IconShieldOff,
  IconTrash,
  IconUser,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface UserDropdownProps {
  user: User
  canRemoveUser: boolean
  canRemoveMFAFactors: boolean
  setSelectedUser: (user: User) => void
  setUserSidePanelOpen: (open: boolean) => void
}

const UserDropdown = ({
  user,
  canRemoveUser,
  canRemoveMFAFactors,
  setSelectedUser,
  setUserSidePanelOpen,
}: UserDropdownProps) => {
  const { ref } = useParams()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const { mutate: resetPassword, isLoading: isResetting } = useUserResetPasswordMutation({
    onSuccess: () => {
      toast.success(`Sent password recovery to ${user.email}`)
    },
  })
  const { mutate: sendMagicLink, isLoading: isSendingLink } = useUserSendMagicLinkMutation({
    onSuccess: () => {
      toast.success(`Sent magic link to ${user.email}`)
    },
  })
  const { mutate: sendOTP, isLoading: isSendingOTP } = useUserSendOTPMutation({
    onSuccess: () => {
      toast.success(`Sent OTP to ${user.phone}`)
    },
  })
  const { mutate: deleteUser, isLoading: isDeleting } = useUserDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${user.email}`)
      setIsDeleteModalOpen(false)
    },
  })
  const { mutate: deleteUserMFAFactors, isLoading: isDeletingFactors } =
    useUserDeleteMFAFactorsMutation({
      onSuccess: () => {
        toast.success("Successfully deleted the user's factors")
        setIsDeleteFactorsModalOpen(false)
      },
    })

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
    if (!ref) return console.error('Project ref is required')
    deleteUser({ projectRef: ref, user })
  }

  async function handleDeleteFactors() {
    await timeout(200)
    if (!ref) return console.error('Project ref is required')
    if (!user.id) return console.error('User id is required')
    deleteUserMFAFactors({ projectRef: ref, userId: user.id })
  }

  const handleViewUserInfo = () => {
    setSelectedUser(user)
    setUserSidePanelOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" loading={isLoading} className="hover:border-muted flex">
            <IconMoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <>
            <DropdownMenuItem className="space-x-2" onClick={handleViewUserInfo}>
              <IconUser size="tiny" />
              <p>View user info</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
        title="Confirm to delete"
        confirmLabel="Delete"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete()
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to delete user {user.email}?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isDeleteFactorsModalOpen}
        title="Confirm to delete"
        confirmLabel="Delete"
        onCancel={() => setIsDeleteFactorsModalOpen(false)}
        onConfirm={() => {
          handleDeleteFactors()
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to delete the user's MFA factors?
        </p>
      </ConfirmationModal>
    </>
  )
}

export default UserDropdown
