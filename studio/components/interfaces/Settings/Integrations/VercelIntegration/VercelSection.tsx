import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { Button, IconExternalLink } from 'ui'

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
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { IntegrationName, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization, useSelectedProject, useStore } from 'hooks'
import { pluralize } from 'lib/helpers'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { IntegrationImageHandler } from '../IntegrationsSettings'
import VercelIntegrationConnectionForm from './VercelIntegrationConnectionForm'

const VercelSection = () => {
  const { ui } = useStore()
  const project = useSelectedProject()
  const org = useSelectedOrganization()
  const { data } = useOrgIntegrationsQuery({ orgSlug: org?.slug })
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

  const { mutate: deleteVercelConnection } = useIntegrationsVercelInstalledConnectionDeleteMutation(
    {
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: 'Successfully deleted Vercel connection',
        })
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

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={VercelTitle}>
          <Markdown content={VercelDetailsSection} />
          <IntegrationImageHandler title="vercel" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Markdown content={VercelContentSectionTop} />
          {vercelIntegrations && vercelIntegrations.length > 0 ? (
            vercelIntegrations
              .filter((x) =>
                x.connections.find((x) => x.supabase_project_ref === project?.parentRef)
              )
              .map((integration, i) => {
                return (
                  <div key={integration.id}>
                    <IntegrationInstallation title={'Vercel'} integration={integration} />
                    {integration.connections.length > 0 ? (
                      <>
                        <IntegrationConnectionHeader />
                        <ul className="flex flex-col">
                          {integration.connections.map((connection) => (
                            <div
                              key={connection.id}
                              className="relative flex flex-col -gap-[1px] [&>li]:pb-0"
                            >
                              <IntegrationConnectionItem
                                connection={connection}
                                type={'Vercel' as IntegrationName}
                                onDeleteConnection={onDeleteVercelConnection}
                                className="!rounded-b-none !mb-0"
                              />
                              <div className="relative pl-8 ml-6 border-l border-muted pb-6">
                                <div className="border-b border-l border-r rounded-b-lg">
                                  <VercelIntegrationConnectionForm
                                    connection={connection}
                                    integration={integration}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <IntegrationConnectionHeader
                        markdown={`### ${integration.connections.length} project ${pluralize(
                          integration.connections.length,
                          'connection'
                        )} Repository connections for Vercel`}
                      />
                    )}
                    <EmptyIntegrationConnection
                      onClick={() => onAddVercelConnection(integration.id)}
                      orgSlug={org?.slug}
                    >
                      Add new project connection
                    </EmptyIntegrationConnection>
                  </div>
                )
              })
          ) : (
            <div>
              <Button asChild type="default" iconRight={<IconExternalLink />}>
                <Link href="https://vercel.com/integrations/supabase-v2" target="_blank">
                  Install Vercel Integration
                </Link>
              </Button>
            </div>
          )}
          {VercelContentSectionBottom && (
            <Markdown content={VercelContentSectionBottom} className="text-foreground-lighter" />
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default VercelSection
