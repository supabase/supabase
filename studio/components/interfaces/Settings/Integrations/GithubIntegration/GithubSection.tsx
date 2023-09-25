import { useCallback } from 'react'

import { IntegrationConnectionItem } from 'components/interfaces/Integrations/IntegrationConnection'
import {
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
import { useIntegrationsGitHubInstalledConnectionDeleteMutation } from 'data/integrations/integrations-github-connection-delete-mutation'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { IntegrationName, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization, useStore } from 'hooks'
import { pluralize } from 'lib/helpers'
import { IntegrationImageHandler } from '../IntegrationsSettings'
import GitHubIntegrationConnectionForm from './GitHubIntegrationConnectionForm'

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

const GitHubSection = () => {
  const { ui } = useStore()
  const org = useSelectedOrganization()
  const { data } = useOrgIntegrationsQuery({ orgSlug: org?.slug })

  const githubIntegrations = data?.filter(
    (integration) => integration.integration.name === 'GitHub'
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

  return (
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
                      // title={ConnectionHeaderTitle}
                      // markdown={`Repository connections for GitHub`}
                      />
                      <ul className="flex flex-col">
                        {integration.connections.map((connection) => (
                          <div
                            key={connection.id}
                            className="relative flex flex-col -gap-[1px] [&>li]:pb-0"
                          >
                            <IntegrationConnectionItem
                              showNode={false}
                              key={connection.id}
                              connection={connection}
                              type={'GitHub' as IntegrationName}
                              onDeleteConnection={onDeleteGitHubConnection}
                              className="!rounded-b-none !mb-0"
                            />

                            <div className="border-b border-l border-r rounded-b-lg">
                              <GitHubIntegrationConnectionForm
                                connection={connection}
                                integration={integration}
                              />
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
                      )} Repository connections for GitHub`}
                    />
                  )}
                </div>
              )
            })}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default GitHubSection
