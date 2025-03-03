import { Edit, Unlink } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useUnlinkIdentityMutation } from 'data/profile/profile-unlink-identity-mutation'
import { useSession } from 'lib/auth'
import { BASE_PATH } from 'lib/constants'
import { cn, Dialog, DialogContent, DialogHeader, DialogTitle } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  ChangeEmailAddressForm,
  GitHubChangeEmailAddress,
  SSOChangeEmailAddress,
} from './ChangeEmailAddress'

export const AccountIdentities = () => {
  const router = useRouter()
  const session = useSession()
  const identities = session?.user.identities ?? []

  const [selectedProviderUnlink, setSelectedProviderUnlink] = useState<string>()
  const [selectedProviderUpdateEmail, setSelectedProviderUpdateEmail] = useState<string>()

  const { mutate: unlinkIdentity, isLoading } = useUnlinkIdentityMutation({
    onSuccess: () => {
      toast.success(
        `Successfully unlinked ${getProviderName(selectedProviderUnlink ?? '')} identity. Identities will be updated when you log out and log back in.`
      )
      setSelectedProviderUnlink(undefined)
    },
  })

  const [_, message] = router.asPath.split('#message=')

  const getProviderName = (provider: string) =>
    provider === 'github' ? 'GitHub' : provider === 'sso' ? 'SSO' : provider

  const onConfirmUnlinkIdentity = async () => {
    const identity = identities.find((i) => i.provider === selectedProviderUnlink)
    if (identity) unlinkIdentity(identity)
  }

  useEffect(() => {
    if (message) toast.success(message.replaceAll('+', ' '))
  }, [message])

  return (
    <>
      <Panel className="mb-4 md:mb-8" title={<h5>Account Identities</h5>}>
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

          return (
            <Panel.Content
              key={identity_id}
              className={cn('flex justify-between', identities.length > 1 ? 'last:border-t' : '')}
            >
              <div className="flex gap-x-4">
                <Image
                  className={cn(iconKey === 'github-icon' ? 'invert' : '')}
                  src={`${BASE_PATH}/img/icons/${iconKey}.svg`}
                  width={30}
                  height={30}
                  alt={`${identity.provider} icon`}
                />
                <div className="">
                  <p className="text-sm capitalize">{providerName}</p>
                  <p className="text-sm text-foreground-lighter">
                    {!!username ? <span>{username} • </span> : null}
                    {(identity as any).email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-x-1">
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
                    onClick={() => setSelectedProviderUnlink(provider)}
                    tooltip={{ content: { side: 'bottom', text: 'Unlink identity' } }}
                  />
                )}
              </div>
            </Panel.Content>
          )
        })}
      </Panel>

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
          ) : selectedProviderUpdateEmail === 'sso' ? (
            <SSOChangeEmailAddress />
          ) : (
            <ChangeEmailAddressForm onClose={() => setSelectedProviderUpdateEmail(undefined)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        variant="warning"
        loading={isLoading}
        visible={!!selectedProviderUnlink}
        title={`Unlink ${getProviderName(selectedProviderUnlink ?? '')} identity`}
        onCancel={() => setSelectedProviderUnlink(undefined)}
        onConfirm={() => onConfirmUnlinkIdentity()}
        confirmLabel="Unlink identity"
        confirmLabelLoading="Unlinking identity"
        alert={{
          base: { variant: 'warning' },
          title: `Confirm to unlink ${getProviderName(selectedProviderUnlink ?? '')} identity from account`,
          description: 'This action cannot be undone',
        }}
      />
    </>
  )
}
