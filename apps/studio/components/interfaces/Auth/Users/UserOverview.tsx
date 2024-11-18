import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Ban, Check, Copy, Mail, ShieldOff, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CopyButton from 'components/ui/CopyButton'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import { useUserUpdateMutation } from 'data/auth/user-update-mutation'
import { User } from 'data/auth/users-infinite-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { timeout } from 'lib/helpers'
import { Button, cn, Separator } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import { BanUserModal } from './BanUserModal'
import { UserHeader } from './UserHeader'
import { PANEL_PADDING } from './UserPanel'
import { providerIconMap } from './Users.utils'

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
  const isEmailAuth = user.email !== null
  const isPhoneAuth = user.phone !== null
  const isBanned = user.banned_until !== null

  const providers = (user.raw_app_meta_data?.providers ?? []).map((provider: string) => {
    return {
      name: provider.startsWith('sso') ? 'SAML' : provider,
      icon:
        provider === 'email'
          ? `${BASE_PATH}/img/icons/email-icon2.svg`
          : providerIconMap[provider]
            ? `${BASE_PATH}/img/icons/${providerIconMap[provider]}.svg`
            : undefined,
    }
  })

  const canUpdateUser = useCheckPermissions(PermissionAction.AUTH_EXECUTE, '*')
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
  const [isBanModalOpen, setIsBanModalOpen] = useState(false)
  const [isUnbanModalOpen, setIsUnbanModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const { data } = useAuthConfigQuery({ projectRef })

  const mailerOtpExpiry = data?.MAILER_OTP_EXP ?? 0
  const minutes = Math.floor(mailerOtpExpiry / 60)
  const seconds = Math.floor(mailerOtpExpiry % 60)
  const formattedExpiry = `${mailerOtpExpiry > 60 ? `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds > 0 ? 'and' : ''} ` : ''}${seconds > 0 ? `${seconds} second${seconds > 1 ? 's' : ''}` : ''}`

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
  const { mutate: updateUser, isLoading: isUpdatingUser } = useUserUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully unbanned user')
      setIsUnbanModalOpen(false)
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

  const handleUnban = () => {
    if (projectRef === undefined) return console.error('Proejct ref is required')
    if (user.id === undefined) {
      return toast.error(`Failed to ban user: User ID not found`)
    }

    updateUser({
      projectRef,
      userId: user.id,
      banDuration: 'none',
    })
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
        <UserHeader user={user} />

        {isBanned ? (
          <Admonition
            type="warning"
            label={`User banned until ${dayjs(user.banned_until).format(DATE_FORMAT)}`}
            className="border-r-0 border-l-0 rounded-none -mt-px [&_svg]:ml-0.5 mb-0"
          />
        ) : (
          <Separator />
        )}

        <div className={cn('flex flex-col gap-1.5', PANEL_PADDING)}>
          <RowData property="User UID" value={user.id} />
          <RowData
            property="Created at"
            value={user.created_at ? dayjs(user.created_at).format(DATE_FORMAT) : undefined}
          />
          <RowData
            property="Updated at"
            value={user.updated_at ? dayjs(user.updated_at).format(DATE_FORMAT) : undefined}
          />
          <RowData property="Invited at" value={user.invited_at} />
          <RowData property="Confirmation sent at" value={user.confirmation_sent_at} />
          <RowData
            property="Confirmed at"
            value={user.confirmed_at ? dayjs(user.confirmed_at).format(DATE_FORMAT) : undefined}
          />
          <RowData
            property="Last signed in"
            value={
              user.last_sign_in_at ? dayjs(user.last_sign_in_at).format(DATE_FORMAT) : undefined
            }
          />
          <RowData property="SSO" value={user.is_sso_user} />
        </div>

        <div className={cn('flex flex-col !pt-0', PANEL_PADDING)}>
          <p>Provider Information</p>
          <p className="text-sm text-foreground-light">The user has the following providers</p>
        </div>

        <div className={cn('flex flex-col -space-y-1 !pt-0', PANEL_PADDING)}>
          {providers.map((provider) => {
            const providerMeta = PROVIDERS_SCHEMAS.find(
              (x) =>
                x.title.toLowerCase() ===
                (provider.name === 'linkedin' ? 'linkedin (oidc)' : provider.name)
            )
            const enabledProperty = Object.keys(providerMeta?.properties ?? {}).find((x) =>
              x.toLowerCase().endsWith('_enabled')
            )
            const providerName =
              provider.name === 'email'
                ? 'email'
                : provider.name === 'linkedin'
                  ? 'LinkedIn'
                  : providerMeta?.title ?? provider.name
            const isActive = data?.[enabledProperty as keyof typeof data] ?? false

            return (
              <div key={provider.name} className={cn(CONTAINER_CLASS, 'items-start justify-start')}>
                {provider.icon && (
                  <img
                    width={16}
                    src={provider.icon}
                    alt={`${provider.name} auth icon`}
                    className={cn('mt-1.5', provider.name === 'github' ? 'dark:invert' : '')}
                  />
                )}
                <div className="flex-grow mt-0.5">
                  <p className="capitalize">{providerName}</p>
                  <p className="text-xs text-foreground-light">
                    Signed in with a {providerName} account via{' '}
                    {providerName === 'SAML' ? 'SSO' : 'OAuth'}
                  </p>
                  <Button asChild type="default" className="mt-2">
                    <Link
                      href={`/project/${projectRef}/auth/providers?provider=${provider.name === 'SAML' ? 'SAML 2.0' : provider.name}`}
                    >
                      Configure {providerName} provider
                    </Link>
                  </Button>
                </div>
                {isActive ? (
                  <div className="flex items-center gap-1 rounded-full border border-brand-400 bg-brand-200 py-1 px-1 text-xs text-brand">
                    <span className="rounded-full bg-brand p-0.5 text-xs text-brand-200">
                      <Check strokeWidth={2} size={12} />
                    </span>
                    <span className="px-1">Enabled</span>
                  </div>
                ) : (
                  <div className="rounded-md border border-strong bg-surface-100 py-1 px-3 text-xs text-foreground-lighter">
                    Disabled
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Separator />

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

        <Separator />

        <div className={cn('flex flex-col', PANEL_PADDING)}>
          <p>Danger zone</p>
          <p className="text-sm text-foreground-light">
            Be wary of the following features as they cannot be undone.
          </p>
        </div>

        <div className={cn('flex flex-col -space-y-1 !pt-0', PANEL_PADDING)}>
          <RowAction
            title="Remove MFA factors"
            description="This will log the user out of all active sessions"
            button={{
              icon: <ShieldOff />,
              text: 'Remove MFA factors',
              disabled: !canRemoveMFAFactors,
              onClick: () => setIsDeleteFactorsModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
          <RowAction
            title={
              isBanned
                ? `User is banned until ${dayjs(user.banned_until).format(DATE_FORMAT)}`
                : 'Ban user'
            }
            description={
              isBanned
                ? 'User has no access to the project until after this date'
                : 'Revoke access to the project for a set duration'
            }
            button={{
              icon: <Ban />,
              text: isBanned ? 'Unban user' : 'Ban user',
              disabled: !canUpdateUser,
              onClick: () => {
                if (isBanned) {
                  setIsUnbanModalOpen(true)
                } else {
                  setIsBanModalOpen(true)
                }
              },
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
              disabled: !canRemoveUser,
              onClick: () => setIsDeleteModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
        </div>
      </div>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        variant="destructive"
        title="Confirm to delete user"
        confirmLabel="Delete"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => handleDelete()}
        alert={{
          title: 'Deleting a user is irreversible',
          description: 'This will remove the user from the project and all associated data.',
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to delete the user{' '}
          <span className="text-foreground">{user.email ?? user.phone ?? 'this user'}</span>?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isDeleteFactorsModalOpen}
        variant="warning"
        title="Confirm to remove MFA factors"
        confirmLabel="Remove factors"
        confirmLabelLoading="Removing"
        onCancel={() => setIsDeleteFactorsModalOpen(false)}
        onConfirm={() => handleDeleteFactors()}
        alert={{
          base: { variant: 'warning' },
          title: 'Removing MFA factors is irreversible',
          description: 'This will log the user out of all active sessions.',
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to remove the MFA factors for the user{' '}
          <span className="text-foreground">{user.email ?? user.phone ?? 'this user'}</span>?
        </p>
      </ConfirmationModal>

      <BanUserModal visible={isBanModalOpen} user={user} onClose={() => setIsBanModalOpen(false)} />

      <ConfirmationModal
        variant="warning"
        visible={isUnbanModalOpen}
        title="Confirm to unban user"
        loading={isUpdatingUser}
        confirmLabel="Unban user"
        confirmLabelLoading="Unbanning"
        onCancel={() => setIsUnbanModalOpen(false)}
        onConfirm={() => handleUnban()}
      >
        <p className="text-sm text-foreground-light">
          The user will have access to your project again once unbanned. Are you sure you want to
          unban this user?
        </p>
      </ConfirmationModal>
    </>
  )
}

export const RowData = ({ property, value }: { property: string; value?: string | boolean }) => {
  return (
    <>
      <div className="flex items-center gap-x-2 group justify-between">
        <p className=" text-foreground-lighter text-sm">{property}</p>
        {typeof value === 'boolean' ? (
          <div className="h-[26px] flex items-center justify-center min-w-[70px]">
            {value ? (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <Check size={10} className="text-contrast" strokeWidth={4} />
              </div>
            ) : (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <X size={10} className="text-contrast" strokeWidth={4} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-x-2 h-[26px] font-mono min-w-[40px]">
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
      <Separator />
    </>
  )
}

export const RowAction = ({
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
    isLoading?: boolean
    onClick: () => void
  }
  success?: {
    title: string
    description: string
  }
  className?: string
}) => {
  const disabled = button?.disabled ?? false

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
        loading={button.isLoading ?? false}
        onClick={button.onClick}
        disabled={disabled}
        tooltip={{
          content: {
            side: 'bottom',
            text: disabled
              ? `You need additional permissions to ${button.text.toLowerCase()}`
              : undefined,
          },
        }}
      >
        {button.text}
      </ButtonTooltip>
    </div>
  )
}
