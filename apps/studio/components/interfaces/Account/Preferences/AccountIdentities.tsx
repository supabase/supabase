import dayjs from 'dayjs'
import { Edit, Unlink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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

import {
  ChangeEmailAddressForm,
  GitHubChangeEmailAddress,
  SSOChangeEmailAddress,
} from './ChangeEmailAddress'
import type { UserIdentity } from '@supabase/supabase-js'
import { useUser } from 'common'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useUnlinkIdentityMutation } from '@/data/profile/profile-unlink-identity-mutation'
import { BASE_PATH } from '@/lib/constants'

const getProviderName = (provider: string) =>
  provider === 'github'
    ? 'GitHub'
    : provider.startsWith('sso')
      ? 'SSO'
      : provider.replaceAll('_', ' ')

export const AccountIdentities = () => {
  const router = useRouter()
  const user = useUser()

  const { data, isPending: isLoading, isSuccess } = useProfileIdentitiesQuery()
  const identities = data?.identities ?? []
  const isChangeExpired = data?.email_change_sent_at
    ? dayjs().utc().diff(dayjs(data?.email_change_sent_at).utc(), 'minute') > 10
    : false

  const hasPassword =
    user?.app_metadata?.provider === 'email' ||
    user?.user_metadata?.has_password === true

  const oauthIdentities = identities.filter((i) => i.provider !== 'email')

  const [selectedIdentityToUnlink, setSelectedIdentityToUnlink] = useState<UserIdentity>()
  const [selectedProviderUpdateEmail, setSelectedProviderUpdateEmail] = useState<string>()

  const { mutate: unlinkIdentity, isPending: isUnlinking } = useUnlinkIdentityMutation({
    onSuccess: () => {
      toast.success(
        `Successfully unlinked ${getProviderName(selectedIdentityToUnlink?.provider ?? '')} identity!`
      )
      setSelectedIdentityToUnlink(undefined)
    },
  })

  const [, message] = router.asPath.split('#message=')

  const onConfirmUnlinkIdentity = async () => {
    if (selectedIdentityToUnlink) unlinkIdentity(selectedIdentityToUnlink)
  }

  useEffect(() => {
    if (message) toast.success(message.replaceAll('+', ' '))
  }, [message])

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Account identities</PageSectionTitle>
          <PageSectionDescription>
            Manage the providers linked to your Supabase account and update their details.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
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
                const providerName = getProviderName(provider)
                const iconKey =
                  provider === 'github'
                    ? 'github-icon'
                    : provider === 'email'
                      ? 'email-icon2'
                      : 'saml-icon'

                const isLastOAuthWithoutPassword =
                  provider !== 'email' &&
                  oauthIdentities.length <= 1 &&
                  !hasPassword

                return (
                  <CardContent key={identity_id} className="flex justify-between items-center py-4">
                    <div className="flex gap-x-4">
                      <Image
                        className={cn(iconKey === 'github-icon' ? 'dark:invert' : '')}
                        src={`${BASE_PATH}/img/icons/${iconKey}.svg`}
                        width={30}
                        height={30}
                        alt={`${identity.provider} icon`}
                      />
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
                        <Button asChild type="default">
                          <Link href="/reset-password?type=change">Change password</Link>
                        </Button>
                      )}
                      <ButtonTooltip
                        type="text"
                        icon={<Edit />}
                        className="w-7"
                        onClick={() => setSelectedProviderUpdateEmail(provider)}
                        tooltip={{ content: { side: 'bottom', text: 'Update email address' } }}
                      />
                      {identities.length > 1 && (
                        <ButtonTooltip
                          type="text"
                          icon={<Unlink />}
                          className="w-7"
                          disabled={isLastOAuthWithoutPassword}
                          onClick={() => setSelectedIdentityToUnlink(identity)}
                          tooltip={{
                            content: {
                              side: 'bottom',
                              text: isLastOAuthWithoutPassword
                                ? 'You must set a password for your account before unlinking this identity'
                                : 'Unlink identity',
                            },
                          }}
                        />
                      )}
                    </div>
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
                {selectedProviderUpdateEmail !== 'email'
                  ? `Updating email address for ${getProviderName(selectedProviderUpdateEmail ?? '')} identity`
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
          visible={!!selectedIdentityToUnlink}
          title={`Unlink ${getProviderName(selectedIdentityToUnlink?.provider ?? '')} identity`}
          onCancel={() => setSelectedIdentityToUnlink(undefined)}
          onConfirm={onConfirmUnlinkIdentity}
          confirmLabel="Unlink identity"
          confirmLabelLoading="Unlinking identity"
          alert={{
            base: { variant: 'warning' },
            title: `Confirm to disconnect your ${getProviderName(selectedIdentityToUnlink?.provider ?? '')} identity`,
            description: `After disconnecting, you will only be able to sign in via ${
              Array.from(
                new Set(
                  identities
                    .filter((i) => i.identity_id !== selectedIdentityToUnlink?.identity_id)
                    .map((i) =>
                      i.provider === 'email'
                        ? hasPassword
                          ? 'email and password'
                          : 'email (recovery/reset password)'
                        : getProviderName(i.provider)
                    )
                )
              ).join(' or ')
            }`,
          }}
        />
      </PageSectionContent>
    </PageSection>
  )
}
