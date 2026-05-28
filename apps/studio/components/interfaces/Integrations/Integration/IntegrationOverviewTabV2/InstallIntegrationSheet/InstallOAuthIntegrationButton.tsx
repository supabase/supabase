import { useParams } from 'common'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useInstallOAuthIntegrationMutation } from '@/data/marketplace/install-oauth-integration-mutation'
import { usePartnerIntegrationsQuery } from '@/data/partners/integration-status-query'
import { useSecretsQuery } from '@/data/secrets/secrets-query'

interface InstallOAuthIntegrationButtonProps {
  integration: IntegrationDefinition
}

export function InstallOAuthIntegrationButton({ integration }: InstallOAuthIntegrationButtonProps) {
  const { ref: projectRef } = useParams()

  const requiresApiKeysCheck =
    integration.installIdentificationMethod === 'secret_key_prefix' && !!integration.secretKeyPrefix

  const requiresEdgeFunctionSecretsCheck =
    integration.installIdentificationMethod === 'edge_function_secret_name' &&
    !!integration.edgeFunctionSecretName

  const requiresPartnerIntegrationsCheck =
    integration.installIdentificationMethod === 'callback_status'

  const { data: apiKeys, isLoading: isApiKeysLoading } = useAPIKeysQuery(
    { projectRef, reveal: false },
    { enabled: requiresApiKeysCheck }
  )

  const { data: edgeFunctionSecrets, isPending: isEdgeFunctionSecretsLoading } = useSecretsQuery(
    { projectRef },
    { enabled: requiresEdgeFunctionSecretsCheck }
  )

  const { data: partnerIntegrations, isPending: isPartnerIntegrationsLoading } =
    usePartnerIntegrationsQuery({ projectRef }, { enabled: requiresPartnerIntegrationsCheck })

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
    (requiresEdgeFunctionSecretsCheck && isEdgeFunctionSecretsLoading) ||
    (requiresPartnerIntegrationsCheck && isPartnerIntegrationsLoading)

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

    if (integration.installIdentificationMethod === 'callback_status') {
      if (isPartnerIntegrationsLoading || !partnerIntegrations) return false
      return partnerIntegrations.some(
        (i) => i.listing_slug === integration.id && i.status === 'ready'
      )
    }

    return false
  }, [
    apiKeys,
    edgeFunctionSecrets,
    integration,
    isApiKeysLoading,
    isEdgeFunctionSecretsLoading,
    isPartnerIntegrationsLoading,
  ])

  const handleInstallClick = async () => {
    if (!integration || !projectRef) return
    if (!integration.id) return toast.error('Listing ID is required')

    installOAuthIntegration({ projectRef, listingSlug: integration.id })
  }

  return (
    <>
      {isIntegrationInstalled ? (
        <Button disabled type="outline" className="shrink-0">
          Installed
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
