import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDownIcon, ExternalLinkIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button, cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IntegrationSectionIcon } from '../IntegrationsSettings'
import VercelIntegrationConnectionForm from './VercelIntegrationConnectionForm'
import { IntegrationConnectionItem } from '@/components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from '@/components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
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

export const VercelSection = ({ isProjectScoped = false }: { isProjectScoped?: boolean }) => {
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
  const description = isProjectScoped
    ? 'Connect Vercel projects to this Supabase project. Supabase keeps environment variables up to date in each connected Vercel project.'
    : 'Connect your Vercel teams to this Supabase organization. Supabase keeps environment variables up to date in each connected project. You can also link multiple Vercel projects to the same Supabase project.'

  return (
    <PageSection id="vercel">
      <PageSectionMeta>
        <div className="flex flex-1 items-start gap-6">
          <IntegrationSectionIcon title="vercel" />
          <PageSectionSummary>
            <PageSectionTitle>Vercel</PageSectionTitle>
            <PageSectionDescription>{description}</PageSectionDescription>
          </PageSectionSummary>
        </div>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canReadVercelConnection ? (
          <NoPermission resourceText="view this organization's Vercel connections" />
        ) : (
          <div className="space-y-6">
            {vercelIntegration ? (
              <div key={vercelIntegration.id}>
                <IntegrationInstallation title="Vercel" integration={vercelIntegration} />
                <IntegrationConnectionHeader
                  title={ConnectionHeaderTitle}
                  className={connections.length === 0 ? 'pb-0' : undefined}
                  markdown="Project connections for Vercel"
                />
                {connections.length > 0 && (
                  <ul>
                    {connections.map((connection) => (
                      <Collapsible
                        key={connection.id}
                        className={cn(
                          'group/collapsible',
                          'relative flex flex-col',
                          '[&>li>div]:rounded-none [&>li>div]:border-b-0',
                          '[&:first-child>li>div]:rounded-t-lg',
                          '[&[data-state=open]>li>div]:border-b',
                          '[&:last-child>li>div]:border-b',
                          '[&:last-child[data-state=closed]>li>div]:rounded-b-lg'
                        )}
                      >
                        <IntegrationConnectionItem
                          connection={connection}
                          disabled={isBranch || !canUpdateVercelConnection}
                          isProjectScoped={isProjectScoped}
                          type={'Vercel' as IntegrationName}
                          onDeleteConnection={onDeleteVercelConnection}
                          leadingAction={
                            isProjectScoped ? (
                              <CollapsibleTrigger asChild>
                                <Button
                                  className="group"
                                  iconRight={
                                    <ChevronDownIcon className="transition-transform group-data-[state=open]:rotate-180" />
                                  }
                                >
                                  Edit
                                </Button>
                              </CollapsibleTrigger>
                            ) : undefined
                          }
                        />
                        {isProjectScoped && (
                          <CollapsibleContent className="overflow-hidden data-closed:animate-collapsible-up data-open:animate-collapsible-down">
                            <div className="relative pl-8 ml-6 border-l border-muted pb-6">
                              <div className="border-b border-l border-r rounded-b-lg">
                                <VercelIntegrationConnectionForm
                                  connection={connection}
                                  integration={vercelIntegration}
                                  disabled={isBranch || !canUpdateVercelConnection}
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    ))}
                  </ul>
                )}
                <EmptyIntegrationConnection
                  disabled={isBranch || !canCreateVercelConnection}
                  onClick={() => onAddVercelConnection(vercelIntegration.id)}
                >
                  Add new project connection
                </EmptyIntegrationConnection>
              </div>
            ) : (
              <EmptyIntegrationConnection
                showNode={false}
                disabled={isBranch}
                href={integrationUrl}
                icon={<ExternalLinkIcon />}
                disabledTooltip="Install the Vercel integration on your project's main branch"
              >
                Install Vercel integration
              </EmptyIntegrationConnection>
            )}
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
      </PageSectionContent>
    </PageSection>
  )
}
