import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { IntegrationConnectionItem } from 'components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import { EmptyIntegrationConnection } from 'components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import type {
  IntegrationName,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { IntegrationImageHandler } from '../IntegrationsSettings'
import GitLabIntegrationConnectionForm from './GitLabIntegrationConnectionForm'

const GitLabTitle = `GitLab Connections`

const GitLabDetailsSection = `
Connect any of your GitLab repositories to a project.
`

const GitLabContentSectionTop = `

### How will GitLab connections work?

You will be able to connect a GitLab repository to a Supabase project.
The GitLab integration will watch for changes in your repository such as file changes, branch changes as well as pull request activity.
`

const GitLabSection = () => {
  const { ref: projectRef } = useParams()
  const project = useSelectedProject()
  const org = useSelectedOrganization()
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()
  const isBranch = project?.parent_project_ref !== undefined

  const canReadGitHubConnection = useCheckPermissions(
    PermissionAction.READ,
    'integrations.github_connections'
  )
  const canCreateGitHubConnection = useCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )
  const canUpdateGitHubConnection = useCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )

  const { data: allConnections } = useGitHubConnectionsQuery({ organizationId: org?.id })

  const { mutateAsync: deleteGitHubConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted Github connection')
    },
  })

  const connections =
    allConnections?.filter((connection) =>
      isBranch
        ? connection.project.ref === project.parent_project_ref
        : connection.project.ref === projectRef
    ) ?? []

  const onAddGitLabConnection = useCallback(() => {
    sidePanelsStateSnapshot.setGitlabConnectionsOpen(true)
  }, [sidePanelsStateSnapshot])

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      if (!org?.id) {
        toast.error('Organization not found')
        return
      }
      await deleteGitHubConnection({ connectionId: connection.id, organizationId: org.id })
    },
    [deleteGitHubConnection, org?.id]
  )

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitLabTitle}>
          <Markdown content={GitLabDetailsSection} />
          <IntegrationImageHandler title="gitlab" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {!canReadGitHubConnection ? (
            <NoPermission resourceText="view this organization's GitLab connections" />
          ) : (
            <>
              <Markdown content={GitLabContentSectionTop} />
              {connections.length > 0 ? (
                <ul className="flex flex-col">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="relative flex flex-col -gap-[1px] [&>li]:pb-0"
                    >
                      <IntegrationConnectionItem
                        showNode={false}
                        disabled={isBranch || !canUpdateGitHubConnection}
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
                        <GitLabIntegrationConnectionForm
                          disabled={isBranch || !canUpdateGitHubConnection}
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
              ) : (
                <EmptyIntegrationConnection
                  onClick={onAddGitLabConnection}
                  orgSlug={org?.slug}
                  showNode={false}
                  disabled={isBranch || !canCreateGitHubConnection}
                >
                  Add new project connection
                </EmptyIntegrationConnection>
              )}
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default GitLabSection
