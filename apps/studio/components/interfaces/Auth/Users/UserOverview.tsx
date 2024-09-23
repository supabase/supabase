import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Check, Copy, Mail, ShieldOff, Trash, X } from 'lucide-react'
import { ComponentProps, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import { User } from 'data/auth/users-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { timeout } from 'lib/helpers'
import { Button, cn, Separator } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PANEL_PADDING } from './UserPanel'
import { getDisplayName } from './Users.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'

const DATE_FORMAT = 'DD MMM, YYYY HH:mm'
const CONTAINER_CLASS = cn(
  'bg-surface-100 border-default text-foreground flex items-center justify-between',
  'gap-x-4 border px-5 py-4 text-sm first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl'
)

interface UserOverviewProps {
  user: User
  onDeleteSuccess: () => void
}

export const UserOverview = ({ user, onDeleteSuccess }: UserOverviewProps) => {
  const { ref: projectRef } = useParams()
  const displayName = getDisplayName(user)
  const hasDisplayName = displayName !== '-'
  const isEmailAuth = user.email !== null
  const isPhoneAuth = user.phone !== null
  const isAnonUser = user.is_anonymous

  const canSendMagicLink = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_magic_link')
  const canSendRecovery = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_recovery')
  const canSendOtp = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_otp')
  const canRemoveUser = useCheckPermissions(PermissionAction.TENANT_SQL_DELETE, 'auth.users')
  const canRemoveMFAFactors = useCheckPermissions(
    PermissionAction.TENANT_SQL_DELETE,
    'auth.mfa_factors'
  )

  const [successAction, setSuccessAction] = useState<
    'send_magic_link' | 'send_recovery' | 'send_otp'
  >()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const { data } = useAuthConfigQuery({ projectRef })
  const mailerOtpExpiry = data?.MAILER_OTP_EXP ?? 0
  const minutes = Math.floor(mailerOtpExpiry / 60)
  const seconds = Math.floor(mailerOtpExpiry % 60)
  const formattedExpiry = `${mailerOtpExpiry > 60 ? `${minutes} minutes ${seconds > 0 ? 'and' : ''} ` : ''}${seconds > 0 ? `${seconds} seconds` : ''}`

  const { mutate: resetPassword, isLoading: isResettingPassword } = useUserResetPasswordMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_recovery')
      toast.success(`Sent password recovery to ${vars.user.email}`)
    },
    onError: (err) => {
      toast.error(`Failed to send password recovery: ${err.message}`)
    },
  })
  const { mutate: sendMagicLink, isLoading: isSendingMagicLink } = useUserSendMagicLinkMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_magic_link')
      toast.success(`Sent magic link to ${vars.user.email}`)
    },
    onError: (err) => {
      toast.error(`Failed to send magic link: ${err.message}`)
    },
  })
  const { mutate: sendOTP, isLoading: isSendingOTP } = useUserSendOTPMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_otp')
      toast.success(`Sent OTP to ${vars.user.phone}`)
    },
    onError: (err) => {
      toast.error(`Failed to send OTP: ${err.message}`)
    },
  })
  const { mutate: deleteUser } = useUserDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${user?.email}`)
      setIsDeleteModalOpen(false)
      onDeleteSuccess()
    },
  })
  const { mutate: deleteUserMFAFactors } = useUserDeleteMFAFactorsMutation({
    onSuccess: () => {
      toast.success("Successfully deleted the user's factors")
      setIsDeleteFactorsModalOpen(false)
    },
  })

  const handleDelete = async () => {
    await timeout(200)
    if (!projectRef) return console.error('Project ref is required')
    deleteUser({ projectRef, user })
  }

  const handleDeleteFactors = async () => {
    await timeout(200)
    if (!projectRef) return console.error('Project ref is required')
    deleteUserMFAFactors({ projectRef, userId: user.id as string })
  }

  useEffect(() => {
    if (successAction !== undefined) {
      const timer = setTimeout(() => setSuccessAction(undefined), 5000)
      return () => clearTimeout(timer)
    }
  }, [successAction])

  return (
    <>
      <div>
        <div className={cn(PANEL_PADDING)}>
          {isPhoneAuth ? (
            <div className="flex items-center gap-x-1">
              <p>{user.phone}</p>
              <CopyButton
                iconOnly
                type="text"
                icon={<Copy />}
                className="px-1"
                text={user?.phone ?? ''}
              />
            </div>
          ) : isAnonUser ? (
            <>
              <p>Anonymous user</p>
              <div className="flex items-center gap-x-1">
                <p className="text-foreground-light text-sm">{user.id}</p>
                <CopyButton
                  iconOnly
                  type="text"
                  icon={<Copy />}
                  className="px-1"
                  text={user?.id ?? ''}
                />
              </div>
            </>
          ) : (
            <>
              {hasDisplayName && <p>{displayName}</p>}
              <div className="flex items-center gap-x-1">
                <p
                  className={cn(
                    hasDisplayName ? 'text-foreground-light text-sm' : 'text-foreground'
                  )}
                >
                  {user.email}
                </p>
                <CopyButton
                  iconOnly
                  type="text"
                  icon={<Copy />}
                  className="px-1"
                  text={user?.email ?? ''}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className={cn('flex flex-col', PANEL_PADDING)}>
          <RowData
            property="Last signed in"
            value={
              user.last_sign_in_at ? dayjs(user.last_sign_in_at).format(DATE_FORMAT) : undefined
            }
          />
          <RowData
            property="Created at"
            value={user.created_at ? dayjs(user.created_at).format(DATE_FORMAT) : undefined}
          />
          <RowData
            property="Updated at"
            value={user.updated_at ? dayjs(user.updated_at).format(DATE_FORMAT) : undefined}
          />
          <RowData property="User UID" value={user.id} />
          <RowData property="SSO" value={user.is_sso_user} />
        </div>

        <div className={cn('flex flex-col', PANEL_PADDING)}>
          <p>Provider Information</p>
          <p className="text-sm text-foreground-light">The user has the following providers</p>
        </div>

        <div className={cn('flex flex-col !pt-0', PANEL_PADDING)}>
          <div className={CONTAINER_CLASS}>Hello</div>
        </div>

        <div className={cn('flex flex-col', PANEL_PADDING)}>
          <RowData property="Invited at" value={user.invited_at} />
          <RowData property="Confirmation sent at" value={user.confirmation_sent_at} />
          <RowData
            property="Confirmed at"
            value={user.confirmed_at ? dayjs(user.confirmed_at).format(DATE_FORMAT) : undefined}
          />
        </div>

        <div className={cn('flex flex-col -space-y-1', PANEL_PADDING)}>
          {isEmailAuth && (
            <>
              <RowAction
                title="Reset password"
                description="Send a password recovery email to the user"
                button={{
                  icon: <Mail />,
                  text: 'Send password recovery',
                  isLoading: isResettingPassword,
                  disabled: !canSendRecovery,
                  onClick: () => {
                    if (projectRef) resetPassword({ projectRef, user })
                  },
                }}
                success={
                  successAction === 'send_recovery'
                    ? {
                        title: 'Password recovery sent',
                        description: `The link in the email is valid for ${formattedExpiry}`,
                      }
                    : undefined
                }
              />
              <RowAction
                title="Send magic link"
                description="Passwordless login via email for the user"
                button={{
                  icon: <Mail />,
                  text: 'Send magic link',
                  isLoading: isSendingMagicLink,
                  disabled: !canSendMagicLink,
                  onClick: () => {
                    if (projectRef) sendMagicLink({ projectRef, user })
                  },
                }}
                success={
                  successAction === 'send_magic_link'
                    ? {
                        title: 'Magic link sent',
                        description: `The link in the email is valid for ${formattedExpiry}`,
                      }
                    : undefined
                }
              />
            </>
          )}
          {isPhoneAuth && (
            <RowAction
              title="Send OTP"
              description="Passwordless login via phone for the user"
              button={{
                icon: <Mail />,
                text: 'Send OTP',
                isLoading: isSendingOTP,
                disabled: !canSendOtp,
                onClick: () => {
                  if (projectRef) sendOTP({ projectRef, user })
                },
              }}
              success={
                successAction === 'send_otp'
                  ? {
                      title: 'OTP sent',
                      description: `The link in the OTP SMS is valid for ${formattedExpiry}`,
                    }
                  : undefined
              }
            />
          )}
        </div>

        <div className={cn('flex flex-col', PANEL_PADDING)}>
          <p>DANGER ZONE</p>
          <p className="text-sm text-foreground-light">
            Be wary with the following features as they cannot be undone.
          </p>
        </div>

        <div className={cn('flex flex-col -space-y-1 !pt-0 !pb-5', PANEL_PADDING)}>
          <RowAction
            title="Remove MFA factors"
            description="This will log the user out of all active sessions"
            button={{
              icon: <ShieldOff />,
              text: 'Remove MFA factors',
              isLoading: isResettingPassword,
              disabled: !canRemoveMFAFactors,
              onClick: () => setIsDeleteFactorsModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
          <RowAction
            title="Delete user"
            description="User will no longer have access to the project"
            button={{
              icon: <Trash />,
              type: 'danger',
              text: 'Delete user',
              isLoading: isSendingMagicLink,
              disabled: !canRemoveUser,
              onClick: () => setIsDeleteModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
        </div>
      </div>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        title="Confirm to delete"
        confirmLabel="Delete"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => handleDelete()}
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
        onConfirm={() => handleDeleteFactors()}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to delete the user's MFA factors?
        </p>
      </ConfirmationModal>
    </>
  )
}

const RowData = ({ property, value }: { property: string; value?: string | boolean }) => {
  return (
    <div className="flex items-center gap-x-2 group">
      <p className="w-36 text-foreground-light text-sm">{property}</p>
      {typeof value === 'boolean' ? (
        <div className="h-[26px] flex items-center justify-center">
          {value ? (
            <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
              <Check size={11} className="text-contrast" strokeWidth={4} />
            </div>
          ) : (
            <X size={13} className="text-foreground-light" />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-x-2 h-[26px]">
          <p className="text-sm">{!value ? '-' : value}</p>
          {!!value && (
            <CopyButton
              iconOnly
              type="text"
              icon={<Copy />}
              className="transition opacity-0 group-hover:opacity-100 px-1"
              text={value}
            />
          )}
        </div>
      )}
    </div>
  )
}

const RowAction = ({
  title,
  description,
  button,
  success,
  className,
}: {
  title: string
  description: string
  button: {
    icon: ReactNode
    type?: ComponentProps<typeof Button>['type']
    text: string
    disabled?: boolean
    isLoading: boolean
    onClick: () => void
  }
  success?: {
    title: string
    description: string
  }
  className?: string
}) => {
  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <div>
        <p>{success ? success.title : title}</p>
        <p className="text-xs text-foreground-light">
          {success ? success.description : description}
        </p>
      </div>

      <ButtonTooltip
        type={button?.type ?? 'default'}
        icon={success ? <Check className="text-brand" /> : button.icon}
        loading={button.isLoading}
        onClick={button.onClick}
        disabled={button?.disabled ?? false}
        tooltip={{
          content: {
            side: 'bottom',
            text: `You need additional permissions to ${button.text.toLowerCase()}`,
          },
        }}
      >
        {button.text}
      </ButtonTooltip>
    </div>
  )
}
