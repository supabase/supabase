import { useParams } from 'common'
import Link from 'next/link'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useInstallOAuthIntegrationMutation } from '@/data/marketplace/install-oauth-integration-mutation'
import { useSecretsQuery } from '@/data/secrets/secrets-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface InstallOAuthIntegrationButtonProps {
  integration: IntegrationDefinition
}

export function InstallOAuthIntegrationButton({ integration }: InstallOAuthIntegrationButtonProps) {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const requiresApiKeysCheck =
    integration.installIdentificationMethod === 'secret_key_prefix' && !!integration.secretKeyPrefix

  const requiresEdgeFunctionSecretsCheck =
    integration.installIdentificationMethod === 'edge_function_secret_name' &&
    !!integration.edgeFunctionSecretName

  const { data: apiKeys, isLoading: isApiKeysLoading } = useAPIKeysQuery(
    { projectRef, reveal: false },
    { enabled: requiresApiKeysCheck }
  )

  const { data: edgeFunctionSecrets, isPending: isEdgeFunctionSecretsLoading } = useSecretsQuery(
    { projectRef },
    { enabled: requiresEdgeFunctionSecretsCheck }
  )

  const { mutate: installOAuthIntegration, isPending: isInstalling } =
    useInstallOAuthIntegrationMutation({
      onSuccess: (data) => {
        if ('redirectUrl' in data) {
          if (!data.redirectUrl) {
            toast.error('Failed to redirect because redirect URL is invalid')
            return
          }
          window.open(data.redirectUrl, '_blank', 'noreferrer')
        } else {
          toast.error('Failed to start integration installation')
        }
      },
    })

  const isLoading =
    (requiresApiKeysCheck && isApiKeysLoading) ||
    (requiresEdgeFunctionSecretsCheck && isEdgeFunctionSecretsLoading)

  const isIntegrationInstalled = useMemo(() => {
    if (!integration) return false

    if (integration.installIdentificationMethod === 'secret_key_prefix') {
      const prefix = integration.secretKeyPrefix
      if (!prefix || isApiKeysLoading || !apiKeys) return false
      return apiKeys.some((k) => k.type === 'secret' && k.name.startsWith(prefix))
    }

    if (integration.installIdentificationMethod === 'edge_function_secret_name') {
      const secretName = integration.edgeFunctionSecretName
      if (!secretName || isEdgeFunctionSecretsLoading || !edgeFunctionSecrets) return false
      return edgeFunctionSecrets.some((secret) => secret.name === secretName)
    }

    return false
  }, [apiKeys, edgeFunctionSecrets, integration, isApiKeysLoading, isEdgeFunctionSecretsLoading])

  const handleInstallClick = async () => {
    if (!integration || !projectRef) return
    if (!integration.id) return toast.error('Listing ID is required')

    installOAuthIntegration({ projectRef, listingSlug: integration.id })
  }

  return (
    <>
      {isIntegrationInstalled ? (
        <Button disabled={isLoading} className="shrink-0" asChild>
          <Link href={`/org/${organization?.slug}/apps`}>Manage integartion</Link>
        </Button>
      ) : (
        <Button
          type="primary"
          className="shrink-0"
          loading={isInstalling || isLoading}
          disabled={isLoading}
          onClick={handleInstallClick}
        >
          Install integration
        </Button>
      )}
    </>
  )
}
