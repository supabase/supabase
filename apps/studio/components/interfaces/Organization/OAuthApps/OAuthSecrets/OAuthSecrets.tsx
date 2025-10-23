import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useClientSecretCreateMutation } from 'data/oauth-secrets/client-secret-create-mutation'
import { CreatedSecret, useClientSecretsQuery } from 'data/oauth-secrets/client-secrets-query'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { Alert_Shadcn_, AlertTitle_Shadcn_, InfoIcon } from 'ui'
import { SecretRow } from './SecretRow'

interface Props {
  selectedApp?: OAuthApp
}

export const OAuthSecrets = ({ selectedApp }: Props) => {
  const { slug } = useParams()
  const [createdSecret, setCreatedSecret] = useState<CreatedSecret>()
  const { can: canManageSecrets } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'oauth_apps')

  const { id: appId } = selectedApp ?? {}

  const { data } = useClientSecretsQuery({ slug, appId })
  const secrets = data?.client_secrets ?? []

  const { mutate: createSecret, isLoading: isCreatingSecret } = useClientSecretCreateMutation({
    onSuccess: (data) => setCreatedSecret(data),
  })

  const handleCreateSecret = () => {
    if (!slug) return console.error('Slug is required')
    if (!appId) return console.error('App ID is required')
    createSecret({ slug, appId })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">Client secrets</span>
          <span className="text-sm text-foreground-light">
            For handling callbacks in the OAuth 2.0 flow. Learn more{' '}
            <InlineLink
              href={`${DOCS_URL}/guides/integrations/build-a-supabase-integration#handling-the-callback`}
            >
              here
            </InlineLink>
            .
          </span>
        </div>

        {canManageSecrets && (
          <ButtonTooltip
            type="default"
            disabled={!appId || secrets.length >= 5}
            onClick={handleCreateSecret}
            loading={isCreatingSecret}
            tooltip={{
              content: {
                side: 'bottom',
                text: secrets.length >= 5 ? 'You can only have up to 5 client secrets' : undefined,
              },
            }}
          >
            Generate new secret
          </ButtonTooltip>
        )}
      </div>

      {createdSecret && (
        <Alert_Shadcn_ variant="default">
          <InfoIcon />
          <AlertTitle_Shadcn_>
            Make sure to copy your new client secret now. You won't be able to see it again.
          </AlertTitle_Shadcn_>
        </Alert_Shadcn_>
      )}

      <div className="-space-y-px">
        {secrets
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((secret) => {
            const isNew = createdSecret?.id === secret.id
            const _secret = isNew
              ? { ...secret, client_secret: createdSecret.client_secret }
              : secret
            return <SecretRow key={secret.id} secret={_secret} appId={appId} />
          })}
      </div>
    </div>
  )
}
