import { useParams } from 'common'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { isOAuthInstalled, useProjectOAuthIntegrationData } from '../../../Landing/Landing.utils'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstallOAuthIntegrationMutation } from '@/data/marketplace/install-oauth-integration-mutation'

interface InstallOAuthIntegrationButtonProps {
  integration: IntegrationDefinition
}

export function InstallOAuthIntegrationButton({ integration }: InstallOAuthIntegrationButtonProps) {
  const { ref: projectRef } = useParams()

  const { data, isLoading } = useProjectOAuthIntegrationData(projectRef)

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

  const isIntegrationInstalled = useMemo(() => {
    if (!integration) return false

    return isOAuthInstalled({ integration, projectData: data })
  }, [data, integration])

  const handleInstallClick = async () => {
    if (!integration || !projectRef) return
    if (!integration.id) return toast.error('Listing ID is required')

    installOAuthIntegration({ projectRef, listingSlug: integration.id })
  }

  return (
    <>
      {isIntegrationInstalled ? (
        <Button disabled variant="outline" className="shrink-0">
          Installed
        </Button>
      ) : (
        <Button
          variant="primary"
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
