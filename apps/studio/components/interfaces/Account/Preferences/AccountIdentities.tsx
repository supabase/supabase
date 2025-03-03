import { Edit, Unlink } from 'lucide-react'
import Image from 'next/image'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useSession } from 'lib/auth'
import { BASE_PATH } from 'lib/constants'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn, Dialog, DialogContent, DialogHeader, DialogTitle } from 'ui'
import {
  ChangeEmailAddressForm,
  GitHubChangeEmailAddress,
  SSOChangeEmailAddress,
} from './ChangeEmailAddress'

// Unlink
// Update email
// View existing identities

// Hide unlink if only identity
// How about reset password?

export const AccountIdentities = () => {
  const router = useRouter()
  const session = useSession()
  const identities = session?.user.identities ?? []

  const [updateProvider, setUpdateProvider] = useState<string>()

  const [_, message] = router.asPath.split('#message=')

  const getProviderName = (provider: string) =>
    provider === 'github' ? 'GitHub' : provider === 'sso' ? 'SSO' : provider

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
                  onClick={() => setUpdateProvider(provider)}
                  tooltip={{ content: { side: 'bottom', text: 'Update email address' } }}
                />
                {identities.length > 1 && (
                  <ButtonTooltip
                    type="text"
                    icon={<Unlink />}
                    className="w-7"
                    onClick={() => console.log('unlink', provider)}
                    tooltip={{ content: { side: 'bottom', text: 'Unlink identity' } }}
                  />
                )}
              </div>
            </Panel.Content>
          )
        })}
      </Panel>

      <Dialog
        open={!!updateProvider}
        onOpenChange={(open: boolean) => {
          if (!open) setUpdateProvider(undefined)
        }}
      >
        <DialogContent>
          <DialogHeader className="border-b">
            <DialogTitle>
              {updateProvider !== 'email'
                ? `Updating email address for ${getProviderName(updateProvider ?? '')} identity`
                : 'Update email address'}
            </DialogTitle>
          </DialogHeader>
          {updateProvider === 'github' ? (
            <GitHubChangeEmailAddress />
          ) : updateProvider === 'sso' ? (
            <SSOChangeEmailAddress />
          ) : (
            <ChangeEmailAddressForm onClose={() => setUpdateProvider(undefined)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
