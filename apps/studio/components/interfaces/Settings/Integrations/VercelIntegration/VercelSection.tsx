import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IntegrationImageHandler } from '../IntegrationsSettings'
import VercelIntegrationConnectionForm from './VercelIntegrationConnectionForm'
import { IntegrationConnectionItem } from '@/components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from '@/components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { InlineLink } from '@/components/ui/InlineLink'
import NoPermission from '@/components/ui/NoPermission'
import { useOrgIntegrationsQuery } from '@/data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from '@/data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from '@/data/integrations/integrations-vercel-projects-query'
import type {
  Integration,
  IntegrationName,
  IntegrationProjectConnection,
} from '@/data/integrations/integrations.types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { pluralize } from '@/lib/helpers'
import { getIntegrationConfigurationUrl } from '@/lib/integration-utils'
import { useSidePanelsStateSnapshot } from '@/state/side-panels'

export const VercelSection = ({ isProjectScoped }: { isProjectScoped: boolean }) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { data } = useOrgIntegrationsQuery({ orgSlug: org?.slug })
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()
  const isBranch = project?.parent_project_ref !== undefined

  const { can: canReadVercelConnection, isLoading: isLoadingPermissions } =
    useAsyncCheckPermissions(PermissionAction.READ, 'integrations.vercel_connections')
  const { can: canCreateVercelConnection } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'integrations.vercel_connections'
  )
  const { can: canUpdateVercelConnection } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.vercel_connections'
  )

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
              ? `https://vercel.com/api/www/avatar?teamId=${integration.metadata.account.team_id}&s=48&format=png`
              : `https://vercel.com/api/www/avatar/${integration.metadata.account.avatar}?s=48`

          return {
            ...integration,
            metadata: {
              ...integration.metadata,
              account: {
                ...integration.metadata.account,
                avatar: avatarSrc,
              },
            },
          } as Integration
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

  const VercelTitle = `Vercel Integration`

  const integrationUrl =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
      ? 'https://vercel.com/integrations/supabase'
      : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
        ? `https://vercel.com/integrations/supabase-staging`
        : 'https://vercel.com/integrations/supabase-local'

  let connections =
    (isProjectScoped
      ? vercelIntegration?.connections.filter(
          (connection) => connection.supabase_project_ref === project?.ref
        )
      : vercelIntegration?.connections) || []

  const ConnectionHeaderTitle = `${connections.length} project ${pluralize(
    connections.length,
    'connection'
  )} `

  return (
    <ScaffoldContainer>
      <ScaffoldSection className="py-12">
        <ScaffoldSectionDetail title={VercelTitle}>
          <p>Connect your Vercel teams to your Supabase organization.</p>
          <IntegrationImageHandler title="vercel" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isLoadingPermissions ? (
            <GenericSkeletonLoader />
          ) : !canReadVercelConnection ? (
            <NoPermission resourceText="view this organization's Vercel connections" />
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  How does the Vercel integration work?
                </h3>
                <p className="text-sm text-foreground-light">
                  Supabase will keep your environment variables up to date in each of the projects
                  you assign to a Supabase project. You can also link multiple Vercel projects to
                  the same Supabase project.
                </p>
              </div>
              <div>
                {vercelIntegration ? (
                  <div key={vercelIntegration.id}>
                    <IntegrationInstallation title={'Vercel'} integration={vercelIntegration} />
                    {connections.length > 0 ? (
                      <>
                        <IntegrationConnectionHeader
                          title={ConnectionHeaderTitle}
                          markdown={`Repository connections for Vercel`}
                        />
                        <ul className="flex flex-col">
                          {connections.map((connection) => (
                            <div
                              key={connection.id}
                              className={cn(
                                isProjectScoped && 'relative flex flex-col -gap-[1px] [&>li]:pb-0'
                              )}
                            >
                              <IntegrationConnectionItem
                                connection={connection}
                                disabled={isBranch || !canUpdateVercelConnection}
                                type={'Vercel' as IntegrationName}
                                onDeleteConnection={onDeleteVercelConnection}
                                className={cn(isProjectScoped && 'rounded-b-none! mb-0!')}
                              />
                              {isProjectScoped ? (
                                <div className="relative pl-8 ml-6 border-l border-muted pb-6">
                                  <div className="border-b border-l border-r rounded-b-lg">
                                    <VercelIntegrationConnectionForm
                                      connection={connection}
                                      integration={vercelIntegration}
                                      disabled={isBranch || !canUpdateVercelConnection}
                                    />
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <IntegrationConnectionHeader
                        title={ConnectionHeaderTitle}
                        className="pb-0"
                        markdown={`Repository connections for Vercel`}
                      />
                    )}
                    <EmptyIntegrationConnection
                      disabled={isBranch || !canCreateVercelConnection}
                      onClick={() => onAddVercelConnection(vercelIntegration.id)}
                    >
                      Add new project connection
                    </EmptyIntegrationConnection>
                  </div>
                ) : (
                  <div>
                    <Button
                      icon={<ExternalLink />}
                      asChild={!isBranch}
                      type="default"
                      disabled={isBranch}
                    >
                      {isBranch ? (
                        <p>Install Vercel Integration</p>
                      ) : (
                        <Link href={integrationUrl} target="_blank" rel="noreferrer">
                          Install Vercel Integration
                        </Link>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              {vercelProjectCount > 0 && vercelIntegration !== undefined && (
                <p className="text-sm text-foreground-light">
                  Your Vercel connection can access {vercelProjectCount} Vercel projects. To change
                  which projects Supabase may use, open your organization’s{' '}
                  <InlineLink href={getIntegrationConfigurationUrl(vercelIntegration)}>
                    Vercel integration settings
                  </InlineLink>
                  .
                </p>
              )}
            </div>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
