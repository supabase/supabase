import type { Provider } from '@supabase/auth-js'
import { Link, useLocation } from '@tanstack/react-router'
import { useFlag } from 'common'
import dayjs from 'dayjs'
import {
  BriefcaseIcon,
  EditIcon,
  IdCardIcon,
  KeyRoundIcon,
  MailIcon,
  UnlinkIcon,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { AddPasswordRow } from './AddPasswordRow'
import {
  ChangeEmailAddressForm,
  GitHubChangeEmailAddress,
  SSOChangeEmailAddress,
} from './ChangeEmailAddress'
import {
  canUnlinkIdentity,
  parseRedirectMessage,
  shouldShowAddPasswordRow,
} from './SignInMethods.utils'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { IdentityProviderIcon } from '@/components/ui/ProviderIcon'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useUnlinkIdentityMutation } from '@/data/profile/profile-unlink-identity-mutation'
import { useEnabledIdentityProviders } from '@/hooks/misc/useEnabledIdentityProviders'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'
import { isSingleOAuthIdentity } from '@/lib/account-recovery/single-oauth-identity'
import { captureCriticalError } from '@/lib/error-reporting'
import {
  buildProviderAuthRedirect,
  getProviderDisplay,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'
import { getErrorMessage } from '@/lib/get-error-message'
import { auth, buildPathWithParams } from '@/lib/gotrue'

export const SignInMethods = ({
  primaryAction,
}: {
  primaryAction?: AccountRecoveryFinding['action'] | 'enable-mfa'
} = {}) => {
  const href = useLocation({ select: (location) => location.href })

  const { data, isPending: isLoading, isSuccess, isError, error } = useProfileIdentitiesQuery()

  const enabledProviders = useEnabledIdentityProviders()
  const connectableExternalProviders = useMemo(
    () => enabledProviders.filter((provider) => provider.showInAccountPreferences),
    [enabledProviders]
  )

  const isAddAccountPasswordEnabled = useFlag('enableAccountPassword')

  const identities = data?.identities ?? []
  const hasSingleOAuthIdentity = isSingleOAuthIdentity({ identities, email: data?.email })
  const showAddPasswordRow =
    isAddAccountPasswordEnabled && shouldShowAddPasswordRow({ identities, email: data?.email })
  const isChangeExpired = data?.email_change_sent_at
    ? dayjs().utc().diff(dayjs(data?.email_change_sent_at).utc(), 'minute') > 10
    : false

  const [selectedProviderUnlink, setSelectedProviderUnlink] = useState<string>()
  const [selectedProviderUpdateEmail, setSelectedProviderUpdateEmail] = useState<string>()
  const [linkingProviderId, setLinkingProviderId] = useState<string>()

  const message = parseRedirectMessage(href)
  const unlinkedExternalProviders = connectableExternalProviders.filter((provider) => {
    return !identities.some(
      (identity) => identity.provider === provider.authProvider || identity.provider === provider.id
    )
  })

  const { mutate: unlinkIdentity, isPending: isUnlinking } = useUnlinkIdentityMutation({
    onSuccess: () => {
      toast.success(`Successfully unlinked ${getProviderName(selectedProviderUnlink)} identity!`)
      setSelectedProviderUnlink(undefined)
    },
  })

  const getProviderName = (provider?: string) =>
    provider ? getProviderDisplay(provider).displayName : undefined

  const onConfirmUnlinkIdentity = async () => {
    if (!selectedProviderUnlink) return
    if (
      !canUnlinkIdentity({ provider: selectedProviderUnlink, identityCount: identities.length })
    ) {
      return
    }
    const identity = identities.find((i) => i.provider === selectedProviderUnlink)
    if (identity) unlinkIdentity(identity)
  }

  const onLinkExternalProvider = async (provider: ExternalIdentityProviderConfig) => {
    setLinkingProviderId(provider.id)

    try {
      const redirectTo = buildPathWithParams(
        buildProviderAuthRedirect(provider.id, '/account/security')
      )

      const { error } = await auth.linkIdentity({
        provider: provider.authProvider as Provider,
        options: { redirectTo, scopes: provider.scopes },
      })

      if (error) throw error
    } catch (error: unknown) {
      const message = getErrorMessage(error) ?? 'Unknown error'
      toast.error(`Failed to link ${provider.displayName} identity: ${message}`)
      captureCriticalError(
        error instanceof Error ? error : new Error(message),
        `link ${provider.displayName} identity`
      )
      setLinkingProviderId(undefined)
    }
  }

  useEffect(() => {
    if (message) toast.success(message)
  }, [message])

  return (
    <PageSection id="sign-in-methods" className="scroll-mt-6">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Sign-in methods</PageSectionTitle>
          <PageSectionDescription>
            Choose how you sign in to your Supabase account.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="flex flex-col gap-4">
        {isError && <AlertError error={error} subject="Failed to retrieve sign-in methods" />}
        {isSuccess && showAddPasswordRow && hasSingleOAuthIdentity && (
          <Admonition
            type="warning"
            title="Add a password for email sign-in"
            description={`Use ${data?.email} and a password as another way to sign in if you lose access to ${getProviderName(identities[0]?.provider)}.`}
          />
        )}
        <Card>
          {isLoading && (
            <CardContent>
              <ShimmeringLoader />
            </CardContent>
          )}
          {isSuccess && (
            <div className="divide-y">
              {showAddPasswordRow && !!data?.email && (
                <AddPasswordRow email={data.email} isPrimary={primaryAction === 'set-password'} />
              )}
              {identities.map((identity) => {
                const { identity_id, provider } = identity
                const isSso = provider.startsWith('sso')
                const username = identity.identity_data?.user_name
                const accountLabel = [
                  !isSso && username !== identity.email ? username : undefined,
                  identity.email,
                ]
                  .filter(Boolean)
                  .join(' · ')
                const providerName = getProviderName(provider)

                return (
                  <Fragment key={identity_id}>
                    <CardContent
                      role="group"
                      aria-label={provider === 'email' ? 'Email address' : providerName}
                      className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 gap-x-4">
                        <SignInMethodIcon provider={provider} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2">
                            <p className={cn('text-sm', provider !== 'email' && 'capitalize')}>
                              {provider === 'email' ? 'Email address' : providerName}
                            </p>
                            {provider === 'email' && data?.new_email && !isChangeExpired && (
                              <Tooltip>
                                <TooltipTrigger className="flex items-center">
                                  <Badge variant="default">Pending change</Badge>
                                </TooltipTrigger>
                                <TooltipContent>Changing to {data?.new_email}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-sm text-foreground-lighter [overflow-wrap:anywhere]">
                            {accountLabel}
                          </p>
                          {isSso && (
                            <p className="text-sm text-foreground-lighter">
                              Managed by your organization
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-x-1">
                        <ButtonTooltip
                          variant="default"
                          size="tiny"
                          icon={<EditIcon size={14} strokeWidth={2} />}
                          aria-label="Update email address"
                          onClick={() => setSelectedProviderUpdateEmail(provider)}
                          tooltip={{ content: { side: 'top', text: 'Update email address' } }}
                        />
                        {identities.length > 1 && provider !== 'email' && (
                          <ButtonTooltip
                            variant="default"
                            size="tiny"
                            icon={<UnlinkIcon size={14} strokeWidth={2} />}
                            aria-label={`Unlink ${providerName} identity`}
                            disabled={
                              !canUnlinkIdentity({
                                provider,
                                identityCount: identities.length,
                              })
                            }
                            onClick={() => setSelectedProviderUnlink(provider)}
                            tooltip={{
                              content: {
                                side: 'bottom',
                                text: 'Unlink identity',
                              },
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                    {provider === 'email' && (
                      <CardContent
                        role="group"
                        aria-label="Password"
                        className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 gap-x-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-selection">
                            <KeyRoundIcon
                              size={18}
                              strokeWidth={2}
                              className="text-foreground-lighter"
                            />
                          </div>
                          <div>
                            <p className="text-sm">Password</p>
                            <p className="text-sm text-foreground-lighter">Configured</p>
                          </div>
                        </div>
                        <ButtonTooltip
                          variant="default"
                          size="tiny"
                          className="hit-area-1 w-6.5"
                          icon={<EditIcon size={14} strokeWidth={2} />}
                          aria-label="Change password"
                          tooltip={{ content: { side: 'top', text: 'Change password' } }}
                          asChild
                        >
                          <Link to="/reset-password" search={{ type: 'change' }} />
                        </ButtonTooltip>
                      </CardContent>
                    )}
                  </Fragment>
                )
              })}

              {unlinkedExternalProviders.map((provider) => {
                return (
                  <CardContent
                    key={provider.id}
                    role="group"
                    aria-label={provider.displayName}
                    className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 gap-x-4">
                      <SignInMethodIcon provider={provider.authProvider} />
                      <div>
                        <p className="text-sm">{provider.displayName}</p>
                        <p className="text-sm text-foreground-lighter">
                          Link your {provider.displayName} account to sign in with{' '}
                          {provider.displayName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      loading={linkingProviderId === provider.id}
                      disabled={!!linkingProviderId}
                      onClick={() => onLinkExternalProvider(provider)}
                    >
                      Connect
                    </Button>
                  </CardContent>
                )
              })}
            </div>
          )}
        </Card>

        <Dialog
          open={!!selectedProviderUpdateEmail}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedProviderUpdateEmail(undefined)
          }}
        >
          <DialogContent>
            <DialogHeader className="border-b">
              <DialogTitle>
                {selectedProviderUpdateEmail !== 'email' ? (
                  <>
                    Update email address for{' '}
                    <span className="capitalize">
                      {getProviderName(selectedProviderUpdateEmail)}
                    </span>{' '}
                    identity
                  </>
                ) : (
                  'Update email address'
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedProviderUpdateEmail === 'github' ? (
              <GitHubChangeEmailAddress />
            ) : selectedProviderUpdateEmail?.startsWith('sso') ? (
              <SSOChangeEmailAddress />
            ) : (
              <ChangeEmailAddressForm onClose={() => setSelectedProviderUpdateEmail(undefined)} />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmationModal
          variant="warning"
          size="small"
          loading={isUnlinking}
          visible={!!selectedProviderUnlink}
          title={`Unlink ${getProviderName(selectedProviderUnlink)} identity`}
          onCancel={() => setSelectedProviderUnlink(undefined)}
          onConfirm={onConfirmUnlinkIdentity}
          confirmLabel="Unlink identity"
          confirmLabelLoading="Unlinking identity"
          alert={{
            base: { variant: 'warning' },
            title: `Confirm to disconnect your ${getProviderName(selectedProviderUnlink)} identity`,
            description:
              'After disconnecting, you will only be able to sign in with your remaining identities.',
          }}
        />
      </PageSectionContent>
    </PageSection>
  )
}

const SignInMethodIcon = ({ provider }: { provider: string }) => {
  const display = getProviderDisplay(provider)
  const isSso = provider.startsWith('sso')
  const ProviderFallbackIcon = isSso ? BriefcaseIcon : IdCardIcon
  const OutlineIcon = provider === 'email' ? MailIcon : ProviderFallbackIcon
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        display.displayName === 'GitHub' ? 'bg-transparent' : 'bg-selection'
      )}
    >
      {!display.hasMonochromeIcon ? (
        <OutlineIcon size={18} strokeWidth={2} className="text-foreground-lighter" />
      ) : (
        <IdentityProviderIcon display={display} size={display.id === 'github' ? 30 : 22} />
      )}
    </div>
  )
}
