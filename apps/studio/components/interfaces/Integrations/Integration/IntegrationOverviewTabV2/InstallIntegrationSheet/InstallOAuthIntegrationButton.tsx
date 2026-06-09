import { useParams } from 'common'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstallOAuthIntegrationMutation } from '@/data/marketplace/install-oauth-integration-mutation'
import { useAuthorizedAppsQuery } from '@/data/oauth/authorized-apps-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface InstallOAuthIntegrationButtonProps {
  integration: IntegrationDefinition
}

export function InstallOAuthIntegrationButton({ integration }: InstallOAuthIntegrationButtonProps) {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const clientId = integration.oauthClientId

  console.log({ integration })

  const { data: authorizedApps, isLoading: isAuthorizedAppsLoading } = useAuthorizedAppsQuery(
    { slug: organization?.slug },
    { enabled: !!clientId && !!organization?.slug }
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

  const isLoading = !!clientId && isAuthorizedAppsLoading

  const isIntegrationConnected = useMemo(() => {
    console.log({
      authorizedApps,
      clientId,
    })
    if (!clientId || !authorizedApps) return false
    return authorizedApps.some((app) => app.client_id === clientId)
  }, [authorizedApps, clientId])

  const handleInstallClick = async () => {
    if (!integration || !projectRef) return
    if (!integration.id) return toast.error('Listing ID is required')

    installOAuthIntegration({ projectRef, listingSlug: integration.id })
  }

  return (
    <>
      {isIntegrationConnected ? (
        <Button disabled type="outline" className="shrink-0">
          Connected
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
