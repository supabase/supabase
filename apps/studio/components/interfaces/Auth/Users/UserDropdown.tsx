import { Mail, MoreHorizontal, ShieldOff, Trash, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import type { User } from 'data/auth/users-query'
import { timeout } from 'lib/helpers'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface UserDropdownProps {
  user: User
  permissions: {
    canRemoveUser: boolean
    canRemoveMFAFactors: boolean
    canSendMagicLink: boolean
    canSendRecovery: boolean
    canSendOtp: boolean
  }
  setSelectedUser: (user: User) => void
  setUserSidePanelOpen: (open: boolean) => void
}

const UserDropdown = ({
  user,
  permissions,
  setSelectedUser,
  setUserSidePanelOpen,
}: UserDropdownProps) => {
  const { ref } = useParams()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const { canRemoveUser, canRemoveMFAFactors, canSendMagicLink, canSendRecovery, canSendOtp } =
    permissions

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
          <Button type="text" loading={isLoading} className="px-1.5" icon={<MoreHorizontal />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <>
            <DropdownMenuItem className="space-x-2" onClick={handleViewUserInfo}>
              <UserIcon size={14} />
              <p>View user info</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.email !== null ? (
              <>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <DropdownMenuItem
                      className="space-x-2 !pointer-events-auto"
                      disabled={!canSendRecovery}
                      onClick={() => {
                        if (canSendRecovery) handleResetPassword()
                      }}
                    >
                      <Mail size={14} />
                      <p>Send password recovery</p>
                    </DropdownMenuItem>
                  </TooltipTrigger_Shadcn_>
                  {!canSendRecovery && (
                    <TooltipContent_Shadcn_ side="left">
                      You need additional permissions to send password recovery.
                    </TooltipContent_Shadcn_>
                  )}
                </Tooltip_Shadcn_>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <DropdownMenuItem
                      disabled={!canSendMagicLink}
                      className="space-x-2 !pointer-events-auto"
                      onClick={() => {
                        if (canSendMagicLink) handleSendMagicLink()
                      }}
                    >
                      <Mail size={14} />
                      <p>Send magic link</p>
                    </DropdownMenuItem>
                  </TooltipTrigger_Shadcn_>
                  {!canSendMagicLink && (
                    <TooltipContent_Shadcn_ side="left">
                      You need additional permissions to send magic link
                    </TooltipContent_Shadcn_>
                  )}
                </Tooltip_Shadcn_>
              </>
            ) : null}
            {user.phone !== null ? (
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <DropdownMenuItem
                    disabled={!canSendOtp}
                    className="space-x-2 !pointer-events-auto"
                    onClick={() => {
                      if (canSendOtp) handleSendOtp()
                    }}
                  >
                    <Mail size={14} />
                    <p>Send OTP</p>
                  </DropdownMenuItem>
                </TooltipTrigger_Shadcn_>
                {!canSendOtp && (
                  <TooltipContent_Shadcn_ side="left">
                    You need additional permissions to send OTP
                  </TooltipContent_Shadcn_>
                )}
              </Tooltip_Shadcn_>
            ) : null}
            <DropdownMenuSeparator />

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  onClick={() => {
                    if (canRemoveMFAFactors) setIsDeleteFactorsModalOpen(true)
                  }}
                  disabled={!canRemoveMFAFactors}
                  className="space-x-2 !pointer-events-auto"
                >
                  <ShieldOff size={14} />
                  <p>Remove MFA factors</p>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canRemoveMFAFactors && (
                <TooltipContent_Shadcn_ side="left">
                  You need additional permissions to remove a user's authentication factors
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  disabled={!canRemoveUser}
                  onClick={() => {
                    if (canRemoveUser) setIsDeleteModalOpen(true)
                  }}
                  className="space-x-2 !pointer-events-auto"
                >
                  <Trash size={14} />
                  <p>Delete user</p>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canRemoveUser && (
                <TooltipContent_Shadcn_ side="left">
                  You need additional permissions to delete users
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
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
