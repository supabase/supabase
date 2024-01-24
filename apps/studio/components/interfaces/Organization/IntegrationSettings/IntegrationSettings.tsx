import { useCallback } from 'react'

import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from 'components/interfaces/Integrations/IntegrationPanels'
import VercelSection from 'components/interfaces/Settings/Integrations/VercelIntegration/VercelSection'
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
import { IntegrationName, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { pluralize } from 'lib/helpers'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { IntegrationConnectionItem } from '../../Integrations/IntegrationConnection'
import SidePanelGitHubRepoLinker from './SidePanelGitHubRepoLinker'
import SidePanelVercelProjectLinker from './SidePanelVercelProjectLinker'
import { Button, IconExternalLink } from 'ui'

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

  const githubIntegrations = data?.filter(
    (integration) => integration.integration.name === 'GitHub'
  )

  const onAddGitHubConnection = useCallback(
    (integrationId: string) => {
      sidePanelsStateSnapshot.setGithubConnectionsIntegrationId(integrationId)
      sidePanelsStateSnapshot.setGithubConnectionsOpen(true)
    },
    [sidePanelsStateSnapshot]
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
`

  function installGitHubIntegration() {
    const w = 600
    const h = 800

    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY

    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height

    const systemZoom = width / window.screen.availWidth
    const left = (width - w) / 2 / systemZoom + dualScreenLeft
    const top = (height - h) / 2 / systemZoom + dualScreenTop
    const newWindow = window.open(
      `https://github.com/apps/supabase-local-testing-2-0/installations/new`,
      'GitHub',
      `scrollbars=yes,resizable=no,status=no,location=no,toolbar=no,menubar=no,
       width=${w / systemZoom}, 
       height=${h / systemZoom}, 
       top=${top}, 
       left=${left}
       `
    )
    if (newWindow) {
      newWindow.focus()
    }
  }

  const GitHubSection = () => (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitHubTitle}>
          <Markdown content={GitHubDetailsSection} />
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Markdown content={GitHubContentSectionTop} />
          <Button
            type="default"
            iconRight={<IconExternalLink />}
            onClick={installGitHubIntegration}
          >
            Install GitHub Integration
          </Button>
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
                  <EmptyIntegrationConnection
                    onClick={() => onAddGitHubConnection(integration.id)}
                    orgSlug={org?.slug}
                  >
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
      <VercelSection isProjectScoped={false} />
      <SidePanelVercelProjectLinker />
      <SidePanelGitHubRepoLinker />
    </>
  )
}

export default IntegrationSettings
