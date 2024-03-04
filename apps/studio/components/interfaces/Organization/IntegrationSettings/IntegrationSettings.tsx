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
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH, OPT_IN_TAGS } from 'lib/constants'
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
  const hasAccessToBranching = org?.opt_in_tags?.includes(OPT_IN_TAGS.PREVIEW_BRANCHES) ?? false
  const { data: connections } = useGitHubConnectionsQuery({ organizationId: org?.id })

  const { mutate: deleteGitHubConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: 'Successfully deleted Github connection',
      })
    },
  })

  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

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

  const GitHubSection = () => (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitHubTitle}>
          <Markdown content={GitHubDetailsSection} />
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Markdown content={GitHubContentSectionTop} />

          <ul className="flex flex-col gap-y-2">
            {connections?.map((connection) => (
              <IntegrationConnectionItem
                key={connection.id}
                connection={{
                  id: String(connection.id),
                  added_by: {
                    id: String(connection.user?.id),
                    primary_email: connection.user?.primary_email ?? '',
                    username: connection.user?.username ?? '',
                  },
                  foreign_project_id: String(connection.repository.id),
                  supabase_project_ref: connection.project.ref,
                  organization_integration_id: 'unused',
                  inserted_at: connection.inserted_at,
                  updated_at: connection.updated_at,
                  metadata: {
                    name: connection.repository.name,
                  } as any,
                }}
                type="GitHub"
                onDeleteConnection={onDeleteGitHubConnection}
              />
            ))}
          </ul>
          {hasAccessToBranching ? (
            <EmptyIntegrationConnection
              onClick={onAddGitHubConnection}
              orgSlug={org?.slug}
              showNode={false}
            >
              Add new project connection
            </EmptyIntegrationConnection>
          ) : (
            <p className="text-sm text-foreground-light">
              Access to{' '}
              <a
                href="https://supabase.com/docs/guides/platform/branching"
                target="_blank"
                rel="noreferrer"
                className="text-foreground"
              >
                branching
              </a>{' '}
              is required to add GitHub connections.
            </p>
          )}
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
