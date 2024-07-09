import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IntegrationConnectionItem } from 'components/interfaces/Integrations/IntegrationConnection'
import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from 'components/interfaces/Integrations/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import type {
  IntegrationName,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { pluralize } from 'lib/helpers'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { Button, cn } from 'ui'
import { IntegrationImageHandler } from '../IntegrationsSettings'
import VercelIntegrationConnectionForm from './VercelIntegrationConnectionForm'

const VercelSection = ({ isProjectScoped }: { isProjectScoped: boolean }) => {
  const project = useSelectedProject()
  const org = useSelectedOrganization()
  const { data } = useOrgIntegrationsQuery({ orgSlug: org?.slug })
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

  const canReadVercelConnection = useCheckPermissions(
    PermissionAction.READ,
    'integrations.vercel_connections'
  )
  const canCreateVercelConnection = useCheckPermissions(
    PermissionAction.CREATE,
    'integrations.vercel_connections'
  )
  const canUpdateVercelConnection = useCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.vercel_connections'
  )

  const isBranch = project?.parent_project_ref !== undefined

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
        ? `https://vercel.com/integrations/supabase-v2-staging`
        : 'https://vercel.com/integrations/supabase-v2-local'

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
      <ScaffoldSection>
        <ScaffoldSectionDetail title={VercelTitle}>
          <Markdown content={VercelDetailsSection} />
          <IntegrationImageHandler title="vercel" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {!canReadVercelConnection ? (
            <NoPermission resourceText="view this organization's Vercel connections" />
          ) : (
            <>
              <Markdown content={VercelContentSectionTop} />
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
                              disabled={!canUpdateVercelConnection}
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
                                    disabled={!canUpdateVercelConnection}
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
                    orgSlug={org?.slug}
                    disabled={!canCreateVercelConnection}
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
              {VercelContentSectionBottom && (
                <Markdown
                  extLinks
                  content={VercelContentSectionBottom}
                  className="text-foreground-lighter"
                />
              )}
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default VercelSection
