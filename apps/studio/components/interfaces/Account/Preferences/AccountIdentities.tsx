import type { Provider } from '@supabase/auth-js'
import { useFlag } from 'common'
import dayjs from 'dayjs'
import { EditIcon, MailIcon, UnlinkIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
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

import { parseRedirectMessage, shouldShowAddPasswordRow } from './AccountIdentities.utils'
import { AddPasswordRow } from './AddPasswordRow'
import {
  ChangeEmailAddressForm,
  GitHubChangeEmailAddress,
  SSOChangeEmailAddress,
} from './ChangeEmailAddress'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { IdentityProviderIcon } from '@/components/ui/ProviderIcon'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useUnlinkIdentityMutation } from '@/data/profile/profile-unlink-identity-mutation'
import { useEnabledIdentityProviders } from '@/hooks/misc/useEnabledIdentityProviders'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import {
  evaluateAccountRecovery,
  type AccountRecoveryFinding,
} from '@/lib/account-recovery/evaluate-account-recovery'
import { captureCriticalError } from '@/lib/error-reporting'
import {
  buildProviderAuthRedirect,
  getProviderDisplay,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'
import { getErrorMessage } from '@/lib/get-error-message'
import { auth, buildPathWithParams } from '@/lib/gotrue'

export const AccountIdentities = ({
  primaryAction,
}: {
  primaryAction?: AccountRecoveryFinding['action'] | 'enable-mfa'
} = {}) => {
  const router = useRouter()
  const hasSecuritySettings = useIsFeatureEnabled('account:show_security_settings')
  const settingsPath = hasSecuritySettings ? '/account/security' : '/account/me'

  const { data, isPending: isLoading, isSuccess, isError, error } = useProfileIdentitiesQuery()

  const enabledProviders = useEnabledIdentityProviders()
  const connectableExternalProviders = useMemo(
    () => enabledProviders.filter((provider) => provider.showInAccountPreferences),
    [enabledProviders]
  )

  const isAddAccountPasswordEnabled = useFlag('enableAccountPassword')

  const identities = data?.identities ?? []
  const isManagedAccount = identities.some((identity) => identity.provider.startsWith('sso'))
  const passwordFinding = evaluateAccountRecovery({
    identities,
    email: data?.email,
    verifiedFactorCount: 0,
    recoveryCodes: { status: 'unknown' },
    features: {
      hasSecuritySettings: false,
      recoveryCodesEnabled: false,
      passwordEnabled: isAddAccountPasswordEnabled,
    },
  }).find((finding) => finding.id === 'single-oauth-identity')
  const showAddPasswordRow =
    isAddAccountPasswordEnabled && shouldShowAddPasswordRow({ identities, email: data?.email })
  const isChangeExpired = data?.email_change_sent_at
    ? dayjs().utc().diff(dayjs(data?.email_change_sent_at).utc(), 'minute') > 10
    : false

  const [selectedProviderUnlink, setSelectedProviderUnlink] = useState<string>()
  const [selectedProviderUpdateEmail, setSelectedProviderUpdateEmail] = useState<string>()
  const [linkingProviderId, setLinkingProviderId] = useState<string>()

  const message = parseRedirectMessage(router.asPath)
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

  const getConfiguredExternalProvider = (provider: string) =>
    connectableExternalProviders.find(
      ({ id, authProvider }) => provider === id || provider === authProvider
    )

  const onConfirmUnlinkIdentity = async () => {
    const identity = identities.find((i) => i.provider === selectedProviderUnlink)
    if (identity) unlinkIdentity(identity)
  }

  const onLinkExternalProvider = async (provider: ExternalIdentityProviderConfig) => {
    setLinkingProviderId(provider.id)

    try {
      const redirectTo = buildPathWithParams(buildProviderAuthRedirect(provider.id, settingsPath))

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
        {isSuccess && showAddPasswordRow && !!data.email && (
          <AddPasswordRow
            email={data.email}
            providerName={passwordFinding ? getProviderName(identities[0]?.provider) : undefined}
            isPrimary={primaryAction === 'set-password'}
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
              {identities.map((identity) => {
                const { identity_id, provider } = identity
                const username = identity.identity_data?.user_name
                const providerDisplay = getProviderDisplay(provider)
                const providerName = providerDisplay.displayName
                const configuredProvider = getConfiguredExternalProvider(provider)
                const canUpdateEmail = !configuredProvider

                return (
                  <CardContent
                    key={identity_id}
                    className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-x-4">
                      <SignInMethodIcon provider={provider} />
                      <div>
                        <div className="flex items-center gap-x-2">
                          <p className="text-sm capitalize">{providerName}</p>
                          {provider === 'email' && data.new_email && !isChangeExpired && (
                            <Tooltip>
                              <TooltipTrigger className="flex items-center">
                                <Badge variant="default">Pending change</Badge>
                              </TooltipTrigger>
                              <TooltipContent>Changing to {data.new_email}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-sm text-foreground-lighter">
                          {!!username ? <span>{username} · </span> : null}
                          {identity.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-x-1">
                      {provider === 'email' && (
                        <Button variant="default" asChild>
                          <Link href="/reset-password?type=change">Change password</Link>
                        </Button>
                      )}
                      {canUpdateEmail && (
                        <ButtonTooltip
                          variant="default"
                          size="tiny"
                          icon={<EditIcon size={14} />}
                          aria-label="Update email address"
                          onClick={() => setSelectedProviderUpdateEmail(provider)}
                          tooltip={{ content: { side: 'top', text: 'Update email address' } }}
                        />
                      )}
                      {identities.length > 1 && (
                        <ButtonTooltip
                          variant="text"
                          icon={<UnlinkIcon />}
                          aria-label={`Unlink ${providerName} identity`}
                          className="w-7"
                          onClick={() => setSelectedProviderUnlink(provider)}
                          tooltip={{ content: { side: 'bottom', text: 'Unlink identity' } }}
                        />
                      )}
                    </div>
                  </CardContent>
                )
              })}

              {unlinkedExternalProviders.map((provider) => {
                return (
                  <CardContent
                    key={provider.id}
                    className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-x-4">
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
        {isSuccess && isManagedAccount && (
          <p className="text-sm text-foreground-light">
            Your organization manages how you sign in.
          </p>
        )}

        <Dialog
          open={!!selectedProviderUpdateEmail}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedProviderUpdateEmail(undefined)
          }}
        >
          <DialogContent>
            <DialogHeader className="border-b">
              <DialogTitle>
                {selectedProviderUpdateEmail !== 'email'
                  ? `Updating email address for ${getProviderName(selectedProviderUpdateEmail)} identity`
                  : 'Update email address'}
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
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        display.displayName === 'GitHub' ? 'bg-transparent' : 'bg-selection'
      )}
    >
      {provider === 'email' ? (
        <MailIcon size={18} strokeWidth={2.5} />
      ) : (
        <IdentityProviderIcon display={display} size={30} />
      )}
    </div>
  )
}
