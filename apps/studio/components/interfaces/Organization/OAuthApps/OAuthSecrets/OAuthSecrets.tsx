import dayjs from 'dayjs'
import { useState } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common/hooks'
import { useClientSecretCreateMutation } from 'data/oauth-secrets/client-secret-create-mutation'
import { useClientSecretsQuery } from 'data/oauth-secrets/client-secrets-query'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, InfoIcon } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { CreatedSecret } from './OAuthSecrets.types'
import SecretRow from './SecretRow'

dayjs.extend(relativeTime)

interface Props {
  // The unique identifier for the OAuth application
  selectedApp?: OAuthApp
}

const OAuthSecrets = ({ selectedApp }: Props) => {
  const { slug } = useParams()
  const [createdSecret, setCreatedSecret] = useState<CreatedSecret>()
  const canManageSecrets = useCheckPermissions(PermissionAction.UPDATE, 'oauth_apps')

  const { id: appId } = selectedApp ?? {}

  const { data } = useClientSecretsQuery({ slug, appId })
  const secrets = data?.client_secrets ?? []

  const { mutate: createSecret, isLoading: isCreatingSecret } = useClientSecretCreateMutation({
    onSuccess: (data) => setCreatedSecret(data),
  })

  const handleCreateSecret = () => {
    if (!appId) return
    createSecret({ slug, appId })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">Client secrets</span>
          <span className="text-sm text-foreground-light">
            Learn more{' '}
            <a
              href="https://supabase.com/docs/guides/integrations/build-a-supabase-integration#handling-the-callback"
              className="text-foreground underline"
            >
              here
            </a>
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
                text: secrets.length >= 5 ? 'You can only have up to 5 client secrets' : undefined,
              },
            }}
          >
            Generate a new client secret
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

export default OAuthSecrets
