import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IntegrationConnectionItem } from 'components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from 'components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionDescription,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import type {
  IntegrationName,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { pluralize } from 'lib/helpers'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { Button, Card, CardContent, cn } from 'ui'
import { IntegrationImageHandler } from '../IntegrationsSettings'
import VercelIntegrationConnectionForm from './VercelIntegrationConnectionForm'

const VercelSection = ({ isProjectScoped }: { isProjectScoped: boolean }) => {
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

  // Section title
  const VercelTitle = `Vercel Integration`

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
    <ScaffoldSection isFullWidth>
      <div className="flex items-center gap-6 mb-8">
        <IntegrationImageHandler title="vercel" />
        <div>
          <ScaffoldSectionTitle>{VercelTitle}</ScaffoldSectionTitle>
          <ScaffoldSectionDescription className="mb-0 mt-1 max-w-2xl">
            Connect your Vercel team to keep environment variables in sync across linked projects,
            and link multiple Vercel projects to the same Supabase project.
          </ScaffoldSectionDescription>
        </div>
      </div>
      <div>
        {isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canReadVercelConnection ? (
          <NoPermission resourceText="view this organization's Vercel connections" />
        ) : (
          <>
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
                            className={cn(isProjectScoped && '!rounded-b-none !mb-0')}
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
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-center">Install Vercel Integration</p>
                  <p className="text-sm text-center text-foreground-light mb-4">
                    Connect your Vercel account to link projects and sync environment variables.
                  </p>
                  {isBranch ? (
                    <Button type="default" disabled>
                      Install Vercel Integration
                    </Button>
                  ) : (
                    <Button icon={<ExternalLink />} asChild type="default">
                      <Link href={integrationUrl} target="_blank" rel="noreferrer">
                        Install Vercel Integration
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
            {VercelContentSectionBottom && (
              <Markdown
                extLinks
                content={VercelContentSectionBottom}
                className="text-foreground-lighter"
              />
            )}
          </>
        )}
      </div>
    </ScaffoldSection>
  )
}

export default VercelSection
