import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import type { IntegrationDefinition } from '../../../Landing/Integrations.constants'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'

interface InstallOAuthIntegrationButtonProps {
  integration: IntegrationDefinition
  projectRef: string
}

export function InstallOAuthIntegrationButton({
  integration,
  projectRef,
}: InstallOAuthIntegrationButtonProps) {
  const [isInstalling, setIsInstalling] = useState(false)

  const { data: apiKeys, isLoading: isApiKeysLoading } = useAPIKeysQuery(
    { projectRef, reveal: false },
    { enabled: !!projectRef }
  )

  const isLoading =
    integration.installIdentificationMethod === 'secret_key_prefix' && isApiKeysLoading

  const isIntegrationInstalled = useMemo(() => {
    if (!apiKeys || !integration) return false
    const prefix = integration.secretKeyPrefix
    if (integration.installIdentificationMethod !== 'secret_key_prefix' || !prefix) return false
    return apiKeys.some((k) => k.type === 'secret' && k.name.startsWith(prefix))
  }, [apiKeys, integration])

  const handleInstallClick = useCallback(async () => {
    if (!integration || !projectRef) return

    if (integration.installUrlType === 'post') {
      setIsInstalling(true)
      try {
        const response = await fetchPost<{ redirectUrl: string }>(
          `${API_URL}/integrations/partners/${projectRef}/${integration.listingId}`,
          {}
        )
        if ('redirectUrl' in response) {
          window.location.href = response.redirectUrl
        } else {
          toast.error('Failed to start integration installation')
        }
      } catch {
        toast.error('Failed to start integration installation')
      } finally {
        setIsInstalling(false)
      }
    } else {
      window.location.href = integration.installUrl ?? '/'
    }
  }, [integration, projectRef])

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
