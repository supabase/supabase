import { useCallback } from 'react'

import { EmptyIntegrationConnection } from 'components/interfaces/Integrations/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import VercelSection from 'components/interfaces/Settings/Integrations/VercelIntegration/VercelSection'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { IntegrationName, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { Button, IconExternalLink } from 'ui'
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
  // [Alaister]: temp override with <any> until the typegen is fixed
  const { data: connections } = useGitHubConnectionsQuery<any>({ organizationId: org?.id })

  const { data: projects } = useProjectsQuery()
  const projectIdsToRef = Object.fromEntries(
    projects?.map((project) => [project.id, project.ref]) ?? []
  )

  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

  const { mutate: deleteGitHubConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: 'Successfully deleted Github connection',
      })
    },
  })

  const onAddGitHubConnection = useCallback(() => {
    sidePanelsStateSnapshot.setGithubConnectionsOpen(true)
  }, [sidePanelsStateSnapshot])

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      if (!org?.id) {
        throw new Error('Organization not found')
      }

      deleteGitHubConnection({
        connectionId: connection.id,
        organizationId: org.id,
      })
    },
    [deleteGitHubConnection, org?.id]
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
          {/* {githubIntegrations &&
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
                    </>
                  ) : (
                    <IntegrationConnectionHeader
                      markdown={`### ${integration.connections.length} project ${pluralize(
                        integration.connections.length,
                        'connection'
                      )} Repository connections for GitHub`}
                    />
                  )}
                </div>
              )
            })} */}
          <ul className="flex flex-col">
            {connections?.map((connection: any) => (
              <IntegrationConnectionItem
                key={connection.id}
                connection={{
                  id: String(connection.id),
                  added_by: {
                    id: String(1),
                    username: 'placeholder',
                    primary_email: 'placeholder@supabase.io',
                  },
                  foreign_project_id: String(connection.repository.id),
                  supabase_project_ref: projectIdsToRef[connection.project_id],
                  organization_integration_id: 'unused',
                  inserted_at: connection.inserted_at,
                  updated_at: connection.updated_at,
                  metadata: {
                    name: connection.repository.name,
                  } as any,
                }}
                type={'GitHub' as IntegrationName}
                onDeleteConnection={onDeleteGitHubConnection}
              />
            ))}
          </ul>
          <EmptyIntegrationConnection onClick={onAddGitHubConnection} orgSlug={org?.slug}>
            Add new project connection
          </EmptyIntegrationConnection>
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
