import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { VercelSectionBase } from './VercelSectionBase'

export const OrganizationVercelSection = () => {
  const { data: org } = useSelectedOrganizationQuery()
  const { data } = useOrgIntegrationsQuery({ orgSlug: org?.slug })
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

  const { can: canReadVercelConnection, isLoading: isLoadingReadPermission } =
    useAsyncCheckProjectPermissions(PermissionAction.READ, 'integrations.vercel_connections')
  const { can: canCreateVercelConnection } = useAsyncCheckProjectPermissions(
    PermissionAction.CREATE,
    'integrations.vercel_connections'
  )
  const { can: canUpdateVercelConnection } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'integrations.vercel_connections'
  )

  const isLoadingPermissions = isLoadingReadPermission

  const { mutate: deleteVercelConnection } = useIntegrationsVercelInstalledConnectionDeleteMutation(
    {
      onSuccess: () => {
        toast.success('Successfully deleted Vercel connection')
      },
    }
  )

  const vercelIntegrations = useMemo(() => {
    return data
      ?.filter((integration) => integration.integration.name === 'Vercel')
      .map((integration) => {
        if (integration.metadata && integration.integration.name === 'Vercel') {
          const avatarSrc =
            !integration.metadata.account.avatar && integration.metadata.account.type === 'Team'
              ? `https://vercel.com/api/www/avatar?teamId=${integration.metadata.account.team_id}&s=48`
              : `https://vercel.com/api/www/avatar/${integration.metadata.account.avatar}?s=48`

          integration['metadata']['account']['avatar'] = avatarSrc
        }

        return integration
      })
  }, [data])

  // We're only supporting one Vercel integration per org for now
  // this will need to be updated when we support multiple integrations
  const vercelIntegration = vercelIntegrations?.[0]
  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      organization_integration_id: vercelIntegration?.id,
    },
    { enabled: vercelIntegration?.id !== undefined }
  )
  const vercelProjectCount = vercelProjectsData?.length ?? 0

  const onAddVercelConnection = useCallback(
    (integrationId: string) => {
      sidePanelsStateSnapshot.setVercelConnectionsIntegrationId(integrationId)
      sidePanelsStateSnapshot.setVercelConnectionsOpen(true)
    },
    [sidePanelsStateSnapshot]
  )

  const onDeleteVercelConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      deleteVercelConnection({
        id: connection.id,
        organization_integration_id: connection.organization_integration_id,
        orgSlug: org?.slug,
      })
    },
    [deleteVercelConnection, org?.slug]
  )

  // Markdown Content
  const VercelTitle = `Vercel Integration`

  const VercelDetailsSection = `

Connect your Vercel teams to your Supabase organization.
`

  const VercelContentSectionTop = `

### How does the Vercel integration work?

Supabase will keep your environment variables up to date in each of the projects you assign to a Supabase project.
You can also link multiple Vercel Projects to the same Supabase project.
`

  const VercelContentSectionBottom =
    vercelProjectCount > 0 && vercelIntegration !== undefined
      ? `
Your Vercel connection has access to ${vercelProjectCount} Vercel Projects.
You can change the scope of the access for Supabase by configuring
[here](${getIntegrationConfigurationUrl(vercelIntegration)}).
`
      : ''

  const integrationUrl =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
      ? 'https://vercel.com/integrations/supabase'
      : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
        ? `https://vercel.com/integrations/supabase-staging`
        : 'https://vercel.com/integrations/supabase-local'

  let connections = vercelIntegration?.connections || []

  return (
    <VercelSectionBase
      isLoadingPermissions={isLoadingPermissions}
      canReadVercelConnection={canReadVercelConnection}
      canCreateVercelConnection={canCreateVercelConnection}
      canUpdateVercelConnection={canUpdateVercelConnection}
      vercelIntegration={vercelIntegration}
      connections={connections}
      onAddVercelConnection={onAddVercelConnection}
      onDeleteVercelConnection={onDeleteVercelConnection}
      integrationUrl={integrationUrl}
      vercelContentSectionTop={VercelContentSectionTop}
      vercelContentSectionBottom={VercelContentSectionBottom}
      vercelTitle={VercelTitle}
      vercelDetailsSection={VercelDetailsSection}
    />
  )
}
