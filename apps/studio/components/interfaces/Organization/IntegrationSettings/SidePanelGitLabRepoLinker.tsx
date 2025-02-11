import { useMemo } from 'react'
import { toast } from 'sonner'

import ProjectLinker from 'components/interfaces/Integrations/VercelGithub/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import type { IntegrationConnectionsCreateVariables } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { EMPTY_ARR } from 'lib/void'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { Button, SidePanel } from 'ui'
import { openInstallGitLabIntegrationWindow } from 'lib/gitlab'
import { useGitLabRepositoriesQuery } from 'data/integrations/gitlab-repositories-query'
import { useGitLabConnectionsQuery } from 'data/integrations/gitlab-connections-query'
import { useGitLabConnectionCreateMutation } from 'data/integrations/gitlab-connection-create-mutation'
import { useGitLabConnectionDeleteMutation } from 'data/integrations/gitlab-connection-delete-mutation'
import { useGitLabAuthorizationQuery } from 'data/integrations/gitlab-authorization-query'

const GITLAB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="93.97 97.52 192.05 184.99">
    <g id="LOGO">
      <path
        fill="#e24329"
        d="M282.83,170.73l-.27-.69-26.14-68.22a6.81,6.81,0,0,0-2.69-3.24,7,7,0,0,0-8,.43,7,7,0,0,0-2.32,3.52l-17.65,54H154.29l-17.65-54A6.86,6.86,0,0,0,134.32,99a7,7,0,0,0-8-.43,6.87,6.87,0,0,0-2.69,3.24L97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82,19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91,40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z"
      ></path>
      <path
        fill="#fc6d26"
        d="M282.83,170.73l-.27-.69a88.3,88.3,0,0,0-35.15,15.8L190,229.25c19.55,14.79,36.57,27.64,36.57,27.64l40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z"
      ></path>
      <path
        fill="#fca326"
        d="M153.43,256.89l19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91S209.55,244,190,229.25C170.45,244,153.43,256.89,153.43,256.89Z"
      ></path>
      <path
        fill="#fc6d26"
        d="M132.58,185.84A88.19,88.19,0,0,0,97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82s17-12.85,36.57-27.64Z"
      ></path>
    </g>
  </svg>
)

export type SidePanelGitLabRepoLinkerProps = {
  projectRef?: string
}

const SidePanelGitLabRepoLinker = ({ projectRef }: SidePanelGitLabRepoLinkerProps) => {
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()

  const { data: gitLabAuthorization, isLoading: isLoadingGitLabAuthorization } =
    useGitLabAuthorizationQuery({ enabled: sidePanelStateSnapshot.gitlabConnectionsOpen })

  // [Alaister]: temp override with <any> until the typegen is fixed
  const { data: gitLabReposData, isLoading: isLoadingGitLabRepos } = useGitLabRepositoriesQuery<
    any[]
  >({
    enabled: Boolean(gitLabAuthorization),
  })

  /**
   * Supabase projects available
   */
  const { data: supabaseProjectsData, isLoading: isLoadingSupabaseProjects } = useProjectsQuery()

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === selectedOrganization?.id)
        .map((project) => ({ name: project.name, ref: project.ref })) ?? EMPTY_ARR,
    [selectedOrganization?.id, supabaseProjectsData]
  )
  console.log({ gitLabReposData })
  const gitlabRepos = useMemo(
    () =>
      gitLabReposData?.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
      })) ?? EMPTY_ARR,
    [gitLabReposData]
  )

  const { data: connections } = useGitLabConnectionsQuery({
    organizationId: selectedOrganization?.id,
  })

  const { mutate: createConnection, isLoading: isCreatingConnection } =
    useGitLabConnectionCreateMutation({
      onSuccess() {
        toast.success('Successfully linked project to repository!')
        sidePanelStateSnapshot.setGitlabConnectionsOpen(false)
      },
    })

  const { mutateAsync: deleteConnection } = useGitLabConnectionDeleteMutation()

  const createGitlabConnection = async (variables: IntegrationConnectionsCreateVariables) => {
    if (!selectedOrganization?.id) {
      throw new Error('No organization id')
    }
    if (!variables.new) {
      throw new Error('No new connection')
    }

    const existingConnection = connections?.find(
      (connection) => connection.project.ref === projectRef
    )

    if (existingConnection) {
      // remove existing connection so we can recreate it or update it
      try {
        await deleteConnection({
          organizationId: selectedOrganization.id,
          connectionId: existingConnection.id,
        })
      } catch (error) {
        // ignore the error to let createConnection handle it
      }
    }

    createConnection({
      organizationId: selectedOrganization.id,
      connection: variables.new,
    })
  }

  return (
    <SidePanel
      header={'Add GitLab repository'}
      size="large"
      visible={sidePanelStateSnapshot.gitlabConnectionsOpen}
      hideFooter
      onCancel={() => sidePanelStateSnapshot.setGitlabConnectionsOpen(false)}
    >
      <div className="py-10 flex flex-col gap-6 bg-studio h-full">
        <SidePanel.Content className="flex flex-col gap-4">
          <Markdown
            content={`
### Choose repository to connect to

Check the details below before proceeding
          `}
          />

          {gitLabAuthorization === null ? (
            <div className="flex flex-col items-center justify-center mt-8 relative border rounded-lg p-12 bg shadow px-20s">
              <p className="text-sm text-center">
                Connect your Supabase projects with your GitLab repositories
              </p>
              <p className="text-sm text-center text-foreground-light">
                Authorize with GitLab to retrieve your GitLab repositories
              </p>
              <Button
                className="w-min mt-3"
                onClick={() => {
                  openInstallGitLabIntegrationWindow('authorize')
                }}
              >
                Authorize GitLab
              </Button>
            </div>
          ) : (
            <ProjectLinker
              defaultSupabaseProjectRef={projectRef}
              foreignProjects={gitlabRepos}
              supabaseProjects={supabaseProjects}
              onCreateConnections={createGitlabConnection}
              isLoading={isCreatingConnection}
              loadingForeignProjects={isLoadingGitLabRepos}
              loadingSupabaseProjects={isLoadingSupabaseProjects}
              integrationIcon={GITLAB_ICON}
              choosePrompt="Choose GitLab Repo"
              showNoEntitiesState={false}
              mode="GitLab"
            />
          )}
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default SidePanelGitLabRepoLinker
