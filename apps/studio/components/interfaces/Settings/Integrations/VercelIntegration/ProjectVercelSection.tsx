import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IntegrationConnectionItem } from 'components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import { useProjectVercelConnectionsQuery } from 'data/integrations/project-vercel-connections-query'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import type {
  IntegrationName,
  IntegrationProjectConnection,
  Integration,
} from 'data/integrations/integrations.types'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { VercelIntegrationConnectionForm } from './VercelIntegrationConnectionForm'
import { MarketplaceConnectionsSection } from './MarketplaceConnectionsSection'
import { VercelSectionBase } from './VercelSectionBase'

export const ProjectVercelSection = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { data } = useProjectVercelConnectionsQuery({ projectRef: project?.ref })
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()
  const isBranch = project?.parent_project_ref !== undefined

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

  const vercelIntegrations = useMemo((): Integration[] => {
    if (!data?.integrations) return []

    return data.integrations.map((integration) => {
      const transformedIntegration: Integration = {
        id: integration.id,
        added_by: {
          ...integration.added_by,
          id: 'placeholder-id', // API doesn't provide this for project endpoint
        },
        inserted_at: integration.inserted_at,
        updated_at: integration.updated_at,
        connections: integration.connections.map((conn) => ({
          id: conn.id,
          inserted_at: conn.inserted_at,
          updated_at: conn.updated_at,
          added_by: {
            ...conn.added_by,
            id: 'placeholder-id', // API doesn't provide this for project endpoint
          },
          supabase_project_ref: conn.supabase_project_ref,
          foreign_project_id: conn.foreign_project_id,
          organization_integration_id: conn.organization_integration_id,
          env_sync_targets: conn.env_sync_targets,
          public_env_var_prefix: conn.public_env_var_prefix,
          metadata: {
            ...conn.metadata,
            id: conn.foreign_project_id,
            link: undefined,
            framework: conn.metadata.framework,
          } as IntegrationProjectConnection['metadata'],
        })),
        integration: { name: 'Vercel' },
        organization: { slug: integration.organization_slug },
        metadata: integration.metadata,
      } as Integration

      if (
        'metadata' in transformedIntegration &&
        transformedIntegration.metadata &&
        'account' in transformedIntegration.metadata
      ) {
        const account = transformedIntegration.metadata.account
        const avatarSrc =
          !account.avatar && account.type === 'Team'
            ? `https://vercel.com/api/www/avatar?teamId=${account.team_id}&s=48`
            : `https://vercel.com/api/www/avatar/${account.avatar}?s=48`

        account.avatar = avatarSrc
      }

      return transformedIntegration
    })
  }, [data])

  const marketplaceIntegrations = data?.marketplace_integrations || []

  // We're only supporting one Vercel integration per org for now
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

  const renderConnectionItem = useCallback(
    (connection: IntegrationProjectConnection) => (
      <div key={connection.id} className="relative flex flex-col -gap-[1px] [&>li]:pb-0">
        <IntegrationConnectionItem
          connection={connection}
          disabled={isBranch || !canUpdateVercelConnection}
          type={'Vercel' as IntegrationName}
          onDeleteConnection={onDeleteVercelConnection}
          className="!rounded-b-none !mb-0"
        />
        <div className="relative pl-8 ml-6 border-l border-muted pb-6">
          <div className="border-b border-l border-r rounded-b-lg">
            <VercelIntegrationConnectionForm
              connection={connection}
              integration={vercelIntegration!}
              disabled={isBranch || !canUpdateVercelConnection}
            />
          </div>
        </div>
      </div>
    ),
    [isBranch, canUpdateVercelConnection, onDeleteVercelConnection, vercelIntegration]
  )

  const VercelTitle = `Vercel Integration`

  const VercelDetailsSection = `Connect your Vercel teams to your Supabase organization.`

  const VercelContentSectionTop = `
### How does the Vercel integration work?

Supabase will keep your environment variables up to date in each of the projects you assign to a Supabase project.
You can also link multiple Vercel Projects to the same Supabase project.
`

  const integrationUrl =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
      ? 'https://vercel.com/integrations/supabase'
      : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
        ? `https://vercel.com/integrations/supabase-staging`
        : 'https://vercel.com/integrations/supabase-local'

  const connections = vercelIntegration?.connections || []

  return (
    <>
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
        vercelTitle={VercelTitle}
        vercelDetailsSection={VercelDetailsSection}
        isBranch={isBranch}
        renderConnectionItem={renderConnectionItem}
        additionalContent={
          <MarketplaceConnectionsSection marketplaceIntegrations={marketplaceIntegrations} />
        }
      />
    </>
  )
}
