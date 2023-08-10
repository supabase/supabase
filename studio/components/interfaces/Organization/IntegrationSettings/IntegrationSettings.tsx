import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { Button, IconExternalLink } from 'ui'

import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from 'components/interfaces/Integrations/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useIntegrationsGitHubInstalledConnectionDeleteMutation } from 'data/integrations/integrations-github-connection-delete-mutation'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { IntegrationName, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { pluralize } from 'lib/helpers'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { IntegrationConnectionItem } from '../../Integrations/IntegrationConnection'
import SidePanelGitHubRepoLinker from './SidePanelGitHubRepoLinker'
import SidePanelVercelProjectLinker from './SidePanelVercelProjectLinker'

const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-48 mt-6 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const IntegrationSettings = () => {
  const { ui } = useStore()
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

  const { mutate: deleteGitHubConnection } = useIntegrationsGitHubInstalledConnectionDeleteMutation(
    {
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: 'Successfully deleted Github connection',
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

  const githubIntegrations = data?.filter(
    (integration) => integration.integration.name === 'GitHub'
  )

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

  const onAddGitHubConnection = useCallback(
    (integrationId: string) => {
      sidePanelsStateSnapshot.setGithubConnectionsIntegrationId(integrationId)
      sidePanelsStateSnapshot.setGithubConnectionsOpen(true)
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

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      deleteGitHubConnection({
        connectionId: connection.id,
        integrationId: connection.organization_integration_id,
        orgSlug: org?.slug,
      })
    },
    [deleteGitHubConnection, org?.slug]
  )

  /**
   * Vercel markdown content
   */

  const VercelTitle = `Vercel Integration`

  const VercelDetailsSection = `

Connect your Vercel teams to your Supabase organization.  
`

  const VercelContentSectionTop = `

### How does the Vercel integration work?

Supabase will keep the right environment variables up to date in each of the projects you assign to a Supabase project. 
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

  const VercelSection = () => (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={VercelTitle}>
          <Markdown content={VercelDetailsSection} />
          <IntegrationImageHandler title="vercel" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Markdown content={VercelContentSectionTop} />

          {vercelIntegrations && vercelIntegrations.length > 0 ? (
            vercelIntegrations.map((integration, i) => {
              const ConnectionHeaderTitle = `${integration.connections.length} project ${pluralize(
                integration.connections.length,
                'connection'
              )} `

              return (
                <div key={integration.id}>
                  <IntegrationInstallation title={'Vercel'} integration={integration} />
                  {integration.connections.length > 0 ? (
                    <>
                      <IntegrationConnectionHeader
                        title={ConnectionHeaderTitle}
                        markdown={`Repository connections for Vercel`}
                      />
                      <ul className="flex flex-col">
                        {integration.connections.map((connection) => (
                          <IntegrationConnectionItem
                            key={connection.id}
                            connection={connection}
                            type={'Vercel' as IntegrationName}
                            onDeleteConnection={onDeleteVercelConnection}
                          />
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
                  <EmptyIntegrationConnection onClick={() => onAddVercelConnection(integration.id)}>
                    Add new project connection
                  </EmptyIntegrationConnection>
                </div>
              )
            })
          ) : (
            <div>
              <Link href="https://vercel.com/integrations/supabase-v2" passHref>
                <Button type="default" iconRight={<IconExternalLink />} asChild>
                  <a target="_blank">Install Vercel Integration</a>
                </Button>
              </Link>
            </div>
          )}
          {VercelContentSectionBottom && (
            <Markdown content={VercelContentSectionBottom} className="text-lighter" />
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )

  /**
   * GitHub markdown content
   */

  const GitHubTitle = `GitHub Connections`

  const GitHubDetailsSection = `
Connect any of your GitHub repositories to a project.  
`

  const GitHubContentSectionTop = `

### How will GitHub connections work?

You will be able to connect a GitHub repository to a Supabase project. 
The GitHub app will watch for changes in your repository such as file changes, branch changes as well as pull request activity.

These connections will be part of a GitHub workflow that is currently in development.
`

  const GitHubSection = () => (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitHubTitle}>
          <Markdown content={GitHubDetailsSection} />
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Markdown content={GitHubContentSectionTop} />
          {githubIntegrations &&
            githubIntegrations.length > 0 &&
            githubIntegrations.map((integration, i) => {
              const ConnectionHeaderTitle = `${integration.connections.length} project ${pluralize(
                integration.connections.length,
                'connection'
              )} `

              return (
                <div key={integration.id}>
                  <IntegrationInstallation title={'GitHub'} integration={integration} />
                  {integration.connections.length > 0 ? (
                    <>
                      <IntegrationConnectionHeader
                        title={ConnectionHeaderTitle}
                        markdown={`Repository connections for GitHub`}
                      />
                      <ul className="flex flex-col">
                        {integration.connections.map((connection) => (
                          <IntegrationConnectionItem
                            key={connection.id}
                            connection={connection}
                            type={'GitHub' as IntegrationName}
                            onDeleteConnection={onDeleteGitHubConnection}
                          />
                        ))}
                      </ul>
                    </>
                  ) : (
                    <IntegrationConnectionHeader
                      markdown={`### ${integration.connections.length} project ${pluralize(
                        integration.connections.length,
                        'connection'
                      )} Repository connections for GitHub`}
                    />
                  )}
                  <EmptyIntegrationConnection onClick={() => onAddGitHubConnection(integration.id)}>
                    Add new project connection
                  </EmptyIntegrationConnection>
                </div>
              )
            })}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )

  return (
    <>
      <GitHubSection />
      <ScaffoldDivider />
      <VercelSection />
      <SidePanelVercelProjectLinker />
      <SidePanelGitHubRepoLinker />
    </>
  )
}

export default IntegrationSettings
