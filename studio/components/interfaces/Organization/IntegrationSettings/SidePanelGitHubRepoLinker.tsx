import { useMemo } from 'react'

import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import { useIntegrationGitHubConnectionsCreateMutation } from 'data/integrations/integrations-github-connections-create-mutation'
import { useGitHubReposQuery } from 'data/integrations/integrations-github-repos-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import { SidePanel } from 'ui'
import { useIntegrationsGitHubInstalledConnectionDeleteMutation } from 'data/integrations/integrations-github-connection-delete-mutation'
import { IntegrationConnectionsCreateVariables } from 'data/integrations/integrations.types'
import { useSidePanelsStateSnapshot } from 'state/side-panels'

const GITHUB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" className="w-6">
    <path
      fill="#ffffff"
      fillRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      clipRule="evenodd"
    />
  </svg>
)

export type SidePanelGitHubRepoLinkerProps = {
  projectRef?: string
}

const SidePanelGitHubRepoLinker = ({ projectRef }: SidePanelGitHubRepoLinkerProps) => {
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()

  const organizationIntegrationId = sidePanelStateSnapshot.githubConnectionsIntegrationId

  const { data: integrationData } = useOrgIntegrationsQuery({
    orgSlug: selectedOrganization?.slug,
  })
  const githubIntegrations = integrationData?.filter(
    (integration) => integration.integration.name === 'GitHub'
  ) // github
  const existingProjectGithubConnection = githubIntegrations?.[0]?.connections.find(
    (connection) => connection.supabase_project_ref === projectRef
  )

  /**
   * Find the right integration
   *
   * we use the snapshot.organizationIntegrationId which should be set whenever this sidepanel is opened
   */
  const selectedIntegration = githubIntegrations?.find((x) => x.id === organizationIntegrationId)

  /**
   * Supabase projects available
   */
  const { data: supabaseProjectsData, isLoading: isLoadingSupabaseProjects } = useProjectsQuery({
    enabled: organizationIntegrationId !== undefined,
  })

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === selectedOrganization?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name, ref: project.ref })) ??
      EMPTY_ARR,
    [selectedOrganization?.id, supabaseProjectsData]
  )

  const { data: githubProjectsData, isLoading: isLoadingGitHubRepos } = useGitHubReposQuery(
    {
      integrationId: organizationIntegrationId,
    },
    { enabled: organizationIntegrationId !== undefined }
  )

  const githubRepos = useMemo(
    () =>
      githubProjectsData?.map((repo) => ({
        id: repo.id.toString(),
        name: repo.full_name,
      })) ?? EMPTY_ARR,
    [githubProjectsData]
  )

  const { mutate: createConnections, isLoading: isCreatingConnection } =
    useIntegrationGitHubConnectionsCreateMutation({
      onSuccess() {
        sidePanelStateSnapshot.setGithubConnectionsOpen(false)
      },
    })

  const { mutate: deleteGitHubConnection } =
    useIntegrationsGitHubInstalledConnectionDeleteMutation()

  const createGithubConnection = (variables: IntegrationConnectionsCreateVariables) => {
    const existingProjectGithubConnection = githubIntegrations?.[0].connections.find(
      (connection) => connection.supabase_project_ref === variables.connection.supabase_project_ref
    )
    if (existingProjectGithubConnection !== undefined && selectedOrganization !== undefined) {
      deleteGitHubConnection({
        connectionId: existingProjectGithubConnection.id,
        integrationId: existingProjectGithubConnection.organization_integration_id,
        orgSlug: selectedOrganization.slug,
      })
    }

    createConnections(variables)
  }

  return (
    <SidePanel
      header={'Add GitHub repository'}
      size="large"
      visible={sidePanelStateSnapshot.githubConnectionsOpen}
      hideFooter
      onCancel={() => sidePanelStateSnapshot.setGithubConnectionsOpen(false)}
    >
      <div className="py-10 flex flex-col gap-6 bg-background h-full">
        <SidePanel.Content>
          <Markdown
            content={`
### Choose repository to connect to

Check the details below before proceeding
          `}
          />
        </SidePanel.Content>
        <SidePanel.Content className="flex flex-col gap-2">
          <ProjectLinker
            defaultSupabaseProjectRef={projectRef}
            defaultForeignProjectId={existingProjectGithubConnection?.foreign_project_id}
            organizationIntegrationId={selectedIntegration?.id}
            foreignProjects={githubRepos}
            supabaseProjects={supabaseProjects}
            onCreateConnections={createGithubConnection}
            installedConnections={selectedIntegration?.connections}
            isLoading={isCreatingConnection}
            loadingForeignProjects={isLoadingGitHubRepos}
            loadingSupabaseProjects={isLoadingSupabaseProjects}
            integrationIcon={GITHUB_ICON}
            choosePrompt="Choose GitHub Repo"
          />
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default SidePanelGitHubRepoLinker
