import { useParams } from 'common'
import { useCallback } from 'react'
import toast from 'react-hot-toast'

import { IntegrationConnectionItem } from 'components/interfaces/Integrations/IntegrationConnection'
import { EmptyIntegrationConnection } from 'components/interfaces/Integrations/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useBranchesDisableMutation } from 'data/branches/branches-disable-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import type {
  IntegrationName,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
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
`

const GitHubSection = () => {
  const { ref: projectRef } = useParams()
  const project = useSelectedProject()
  const org = useSelectedOrganization()
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

  const { data: allConnections } = useGitHubConnectionsQuery({ organizationId: org?.id })
  const { data: branches } = useBranchesQuery({ projectRef })

  const { mutate: deleteGitHubConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted Github connection')
    },
  })

  const { mutate: disableBranching } = useBranchesDisableMutation()

  const hasAccessToBranching = useFlag<boolean>('branchManagement')

  const previewBranches = (branches ?? []).filter((branch) => !branch.is_default)
  const isBranch = project?.parent_project_ref !== undefined
  const isBranchingEnabled =
    project?.is_branch_enabled === true || project?.parent_project_ref !== undefined

  const connections =
    allConnections?.filter((connection) =>
      isBranch
        ? connection.project.ref === project.parent_project_ref
        : connection.project.ref === projectRef
    ) ?? []

  const onAddGitHubConnection = useCallback(() => {
    sidePanelsStateSnapshot.setGithubConnectionsOpen(true)
  }, [sidePanelsStateSnapshot])

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      if (isBranchingEnabled) {
        if (!projectRef) throw new Error('Project ref not found')
        disableBranching({ projectRef, branchIds: previewBranches?.map((branch) => branch.id) })
      }
      if (!org?.id) throw new Error('Organization not found')
      deleteGitHubConnection({ connectionId: connection.id, organizationId: org.id })
    },
    [
      deleteGitHubConnection,
      disableBranching,
      isBranchingEnabled,
      org?.id,
      previewBranches,
      projectRef,
    ]
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

          {connections.length > 0 ? (
            <ul className="flex flex-col">
              {connections.map((connection) => (
                <div key={connection.id} className="relative flex flex-col -gap-[1px] [&>li]:pb-0">
                  <IntegrationConnectionItem
                    showNode={false}
                    disabled={isBranch}
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
                    type={'GitHub' as IntegrationName}
                    onDeleteConnection={onDeleteGitHubConnection}
                    className="!rounded-b-none !mb-0"
                  />

                  <div className="border-b border-l border-r rounded-b-lg">
                    <GitHubIntegrationConnectionForm
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
                          supabaseConfig: {
                            supabaseDirectory: connection.workdir,
                            supabaseChangesOnly: connection.supabase_changes_only,
                            branchLimit: connection.branch_limit,
                          },
                        } as any,
                      }}
                    />
                  </div>
                </div>
              ))}
            </ul>
          ) : hasAccessToBranching ? (
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
}

export default GitHubSection
