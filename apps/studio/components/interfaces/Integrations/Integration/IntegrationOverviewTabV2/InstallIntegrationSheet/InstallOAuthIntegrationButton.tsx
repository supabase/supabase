import { useParams } from 'common'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useInstallOAuthIntegrationMutation } from '@/data/marketplace/install-oauth-integration-mutation'

interface InstallOAuthIntegrationButtonProps {
  integration: IntegrationDefinition
}

export function InstallOAuthIntegrationButton({ integration }: InstallOAuthIntegrationButtonProps) {
  const { ref: projectRef } = useParams()

  const { data: apiKeys, isLoading: isApiKeysLoading } = useAPIKeysQuery(
    { projectRef, reveal: false },
    { enabled: !!projectRef }
  )

  const { mutate: installOAuthIntegration, isPending: isInstalling } =
    useInstallOAuthIntegrationMutation({
      onSuccess: (data) => {
        if ('redirectUrl' in data) {
          if (!data.redirectUrl) {
            toast.error('Failed to redirect because redirect URL is invalid')
            return
          }
          window.location.href = data.redirectUrl
        } else {
          toast.error('Failed to start integration installation')
        }
      },
    })

  const isLoading =
    integration.installIdentificationMethod === 'secret_key_prefix' && isApiKeysLoading

  const isIntegrationInstalled = useMemo(() => {
    if (!integration) return false

    const prefix = integration.secretKeyPrefix

    if (integration.installIdentificationMethod !== 'secret_key_prefix' || !prefix) return false
    if (isApiKeysLoading || !apiKeys) return false

    return apiKeys.some((k) => k.type === 'secret' && k.name.startsWith(prefix))
  }, [apiKeys, integration, isApiKeysLoading])

  const handleInstallClick = async () => {
    if (!integration || !projectRef) return

    if (integration.installUrlType === 'post') {
      if (!integration.listingId) return toast.error('Listing ID is required')
      installOAuthIntegration({ projectRef, id: integration.listingId })
    } else {
      window.location.href = integration.installUrl ?? '/'
    }
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
