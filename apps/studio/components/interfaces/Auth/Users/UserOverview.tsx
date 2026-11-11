import { useParams } from 'common'
import dayjs from 'dayjs'
import { CheckIcon, ChevronRightIcon, CopyIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Card, cn, Separator } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import { BanUserModal } from './BanUserModal'
import { DeleteUserModal } from './DeleteUserModal'
import { UserFields } from './UserFields'
import { providerIconMap } from './Users.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import CopyButton from '@/components/ui/CopyButton'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useUserDeleteMFAFactorsMutation } from '@/data/auth/user-delete-mfa-factors-mutation'
import { useUserResetPasswordMutation } from '@/data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from '@/data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from '@/data/auth/user-send-otp-mutation'
import { useUserUpdateMutation } from '@/data/auth/user-update-mutation'
import { User } from '@/data/auth/users-infinite-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { BASE_PATH } from '@/lib/constants'
import { timeout } from '@/lib/helpers'

const DATE_FORMAT = 'DD MMM, YYYY HH:mm'
const CONTAINER_CLASS = cn(
  'bg-surface-100 border-default text-foreground flex flex-wrap items-center justify-between',
  'gap-x-4 gap-y-2 border px-5 py-4 text-sm first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl'
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
  const isVerified = user.confirmed_at != null

  const { authenticationSignInProviders } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
  ])

  const providers = ((user.raw_app_meta_data?.providers as string[]) ?? []).map(
    (provider: string) => {
      return {
        name: provider.startsWith('sso') ? 'SAML' : provider,
        icon:
          provider === 'email'
            ? `${BASE_PATH}/img/icons/email-icon2.svg`
            : providerIconMap[provider]
              ? `${BASE_PATH}/img/icons/${providerIconMap[provider]}.svg`
              : undefined,
      }
    }
  )

  const { can: canUpdateUser } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_USERS_WRITE
  )
  const { can: canSendMagicLink } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_USERS_WRITE
  )
  const { can: canSendRecovery } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_USERS_WRITE
  )
  const { can: canSendOtp } = useAsyncCheckPermissionsV2(FGA_PERMISSIONS.PROJECT.AUTH_USERS_WRITE)
  const { can: canRemoveUser } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_USERS_WRITE
  )
  const { can: canRemoveMFAFactors } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_USERS_WRITE
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

  const { mutate: resetPassword, isPending: isResettingPassword } = useUserResetPasswordMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_recovery')
      toast.success(`Sent password recovery to ${vars.user.email}`)
    },
    onError: (err) => {
      toast.error(`Failed to send password recovery: ${err.message}`)
    },
  })
  const { mutate: sendMagicLink, isPending: isSendingMagicLink } = useUserSendMagicLinkMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_magic_link')
      toast.success(
        isVerified
          ? `Sent magic link to ${vars.user.email}`
          : `Sent confirmation email to ${vars.user.email}`
      )
    },
    onError: (err) => {
      toast.error(
        isVerified
          ? `Failed to send magic link: ${err.message}`
          : `Failed to send confirmation email: ${err.message}`
      )
    },
  })
  const { mutate: sendOTP, isPending: isSendingOTP } = useUserSendOTPMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_otp')
      toast.success(`Sent OTP to ${vars.user.phone}`)
    },
    onError: (err) => {
      toast.error(`Failed to send OTP: ${err.message}`)
    },
  })
  const { mutate: deleteUserMFAFactors } = useUserDeleteMFAFactorsMutation({
    onSuccess: () => {
      toast.success("Successfully deleted the user's factors")
      setIsDeleteFactorsModalOpen(false)
    },
  })
  const { mutate: updateUser, isPending: isUpdatingUser } = useUserUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully unbanned user')
      setIsUnbanModalOpen(false)
    },
  })

  const handleDeleteFactors = async () => {
    await timeout(200)
    if (!projectRef) return console.error('Project ref is required')
    deleteUserMFAFactors({ projectRef, userId: user.id as string })
  }

  const handleUnban = () => {
    if (projectRef === undefined) return console.error('Project ref is required')
    if (user.id === undefined) {
      return toast.error(`Failed to ban user: User ID not found`)
    }

    updateUser({
      projectRef,
      userId: user.id,
      banDuration: 'none',
    })
  }

  const sentDescription = formattedExpiry ? `Sent, valid for ${formattedExpiry}` : 'Sent'
  let magicLinkDescription = isVerified
    ? 'Email a passwordless sign-in link'
    : 'Email a link to confirm their address'
  if (successAction === 'send_magic_link') {
    magicLinkDescription = isVerified ? sentDescription : 'Sent'
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
        {isBanned && (
          <Admonition
            type="warning"
            description={`User banned until ${dayjs(user.banned_until).format(DATE_FORMAT)}`}
            className="border-r-0 border-l-0 border-t-0 rounded-none [&_svg]:ml-0.5"
          />
        )}

        <UserFields user={user} className="pt-3" />

        {providers.length > 0 && (
          <UserSection title="Providers">
            {providers.map((provider) => {
              const providerMeta = PROVIDERS_SCHEMAS.find(
                (x) =>
                  ('key' in x && x.key === provider.name) || x.title.toLowerCase() === provider.name
              )
              const enabledProperty =
                provider.name.toLowerCase() === 'web3'
                  ? (
                      {
                        solana: 'EXTERNAL_WEB3_SOLANA_ENABLED',
                        ethereum: 'EXTERNAL_WEB3_ETHEREUM_ENABLED',
                      } as const
                    )[
                      (
                        (user.raw_user_meta_data?.custom_claims as { chain?: string } | undefined)
                          ?.chain ?? ''
                      ).toLowerCase() as 'solana' | 'ethereum'
                    ]
                  : Object.keys(providerMeta?.properties ?? {}).find((x) =>
                      x.toLowerCase().endsWith('_enabled')
                    )
              const providerName =
                provider.name === 'email'
                  ? provider.name.toLowerCase()
                  : (providerMeta?.title ?? provider.name)
              const isActive = data?.[enabledProperty as keyof typeof data] ?? false

              const content = (
                <>
                  {provider.icon ? (
                    <img
                      width={16}
                      height={16}
                      src={provider.icon}
                      alt=""
                      className={cn('shrink-0', provider.name === 'github' && 'dark:invert')}
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate capitalize">{providerName}</span>
                  <Badge variant={isActive ? 'success' : 'default'}>
                    {isActive ? 'Enabled' : 'Disabled'}
                  </Badge>
                </>
              )

              if (!authenticationSignInProviders) {
                return (
                  <div key={provider.name} className={USER_SECTION_ROW_CLASS}>
                    {content}
                  </div>
                )
              }

              return (
                <Link
                  key={provider.name}
                  href={`/project/${projectRef}/auth/providers?provider=${provider.name === 'SAML' ? 'SAML 2.0' : provider.name}`}
                  aria-label={`Configure ${providerName} provider`}
                  className={cn(USER_SECTION_ROW_CLASS, 'transition-colors hover:bg-surface-200')}
                >
                  {content}
                  <ChevronRightIcon
                    size={14}
                    strokeWidth={1.5}
                    aria-hidden
                    className="-mr-1 shrink-0 text-foreground-lighter"
                  />
                </Link>
              )
            })}
          </UserSection>
        )}

        {(isEmailAuth || isPhoneAuth) && (
          <UserSection title="Sign-in help">
            {isEmailAuth && (
              <UserActionRow
                title="Password recovery"
                description={
                  successAction === 'send_recovery'
                    ? sentDescription
                    : 'Email a link to reset their password'
                }
                isSent={successAction === 'send_recovery'}
                button={{
                  text: 'Send link',
                  isLoading: isResettingPassword,
                  canPerform: canSendRecovery,
                  permissionAction: 'send password recovery',
                  onClick: () => {
                    if (projectRef) resetPassword({ projectRef, user })
                  },
                }}
              />
            )}
            {isEmailAuth && (
              <UserActionRow
                title={isVerified ? 'Magic link' : 'Confirmation email'}
                description={magicLinkDescription}
                isSent={successAction === 'send_magic_link'}
                button={{
                  text: isVerified ? 'Send link' : 'Send email',
                  isLoading: isSendingMagicLink,
                  canPerform: canSendMagicLink,
                  permissionAction: isVerified ? 'send a magic link' : 'send a confirmation email',
                  onClick: () => {
                    if (projectRef) sendMagicLink({ projectRef, user })
                  },
                }}
              />
            )}
            {isPhoneAuth && (
              <UserActionRow
                title="One-time password"
                description={
                  successAction === 'send_otp'
                    ? sentDescription
                    : 'Text a passwordless sign-in code'
                }
                isSent={successAction === 'send_otp'}
                button={{
                  text: 'Send code',
                  isLoading: isSendingOTP,
                  canPerform: canSendOtp,
                  permissionAction: 'send a one-time password',
                  onClick: () => {
                    if (projectRef) sendOTP({ projectRef, user })
                  },
                }}
              />
            )}
          </UserSection>
        )}

        <UserSection title="Danger zone">
          <UserActionRow
            title="MFA factors"
            description="Remove every factor, dropping the user to AAL1"
            button={{
              text: 'Remove',
              canPerform: canRemoveMFAFactors,
              permissionAction: 'remove MFA factors',
              onClick: () => setIsDeleteFactorsModalOpen(true),
            }}
          />
          <UserActionRow
            title={isBanned ? 'Banned' : 'Ban user'}
            description={
              isBanned
                ? `No access until ${dayjs(user.banned_until).format(DATE_FORMAT)}`
                : 'Block access for a set duration'
            }
            button={{
              text: isBanned ? 'Unban' : 'Ban',
              canPerform: canUpdateUser,
              permissionAction: isBanned ? 'unban users' : 'ban users',
              onClick: () => {
                if (isBanned) {
                  setIsUnbanModalOpen(true)
                } else {
                  setIsBanModalOpen(true)
                }
              },
            }}
          />
          <UserActionRow
            title="Delete user"
            description="Permanently remove the user and their access"
            button={{
              text: 'Delete',
              variant: 'danger',
              canPerform: canRemoveUser,
              permissionAction: 'delete users',
              onClick: () => setIsDeleteModalOpen(true),
            }}
          />
        </UserSection>
      </div>

      <DeleteUserModal
        visible={isDeleteModalOpen}
        selectedUser={user}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteSuccess={() => {
          setIsDeleteModalOpen(false)
          onDeleteSuccess()
        }}
      />

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
          title:
            "Removing MFA factors will drop the user's authentication assurance level (AAL) to AAL1",
          description: 'Note that this does not sign the user out',
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to remove the MFA factors for the user{' '}
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

const USER_SECTION_ROW_CLASS =
  'flex min-h-11 items-center gap-x-3 px-3 py-2 text-sm text-foreground'

/** A titled card of rows, each separated by a rule, like the providers list in Auth. */
const UserSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-y-2 border-t px-4 py-4">
    <h3 className="heading-default text-foreground">{title}</h3>
    <Card className="divide-y overflow-hidden">{children}</Card>
  </section>
)

/** One action on the user: what it does on the left, the button that does it on the right. */
const UserActionRow = ({
  title,
  description,
  isSent = false,
  button,
}: {
  title: string
  description: string
  isSent?: boolean
  button: {
    text: string
    variant?: ComponentProps<typeof Button>['variant']
    isLoading?: boolean
    canPerform: boolean
    /** Finishes "You need additional permissions to …" when the button is disabled. */
    permissionAction: string
    onClick: () => void
  }
}) => (
  <div className={USER_SECTION_ROW_CLASS}>
    <div className="min-w-0 flex-1">
      <p className="truncate">{title}</p>
      <p className="text-foreground-lighter">{description}</p>
    </div>
    <ButtonTooltip
      size="tiny"
      variant={button.variant ?? 'default'}
      className="shrink-0"
      icon={isSent ? <CheckIcon className="text-brand" /> : undefined}
      loading={button.isLoading ?? false}
      disabled={!button.canPerform}
      onClick={button.onClick}
      tooltip={{
        content: {
          side: 'bottom',
          text: button.canPerform
            ? undefined
            : `You need additional permissions to ${button.permissionAction}`,
        },
      }}
    >
      {button.text}
    </ButtonTooltip>
  </div>
)

export const RowData = ({ property, value }: { property: string; value?: string | boolean }) => {
  return (
    <>
      <div className="flex items-center gap-x-2 group justify-between">
        <p className=" text-foreground-lighter text-xs">{property}</p>
        {typeof value === 'boolean' ? (
          <div className="h-[26px] flex items-center justify-center min-w-[70px]">
            {value ? (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <CheckIcon size={10} className="text-contrast" strokeWidth={4} />
              </div>
            ) : (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <XIcon size={10} className="text-contrast" strokeWidth={4} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-x-2 h-[26px] font-mono min-w-[40px]">
            <p className="text-xs">{!value ? '-' : value}</p>
            {!!value && (
              <CopyButton
                iconOnly
                variant="text"
                icon={<CopyIcon />}
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
    variant?: ComponentProps<typeof Button>['variant']
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
        variant={button?.variant ?? 'default'}
        icon={success ? <CheckIcon className="text-primary" /> : button.icon}
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
