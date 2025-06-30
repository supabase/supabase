import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useCallback, useMemo } from 'react'

import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { EmptyIntegrationConnection } from 'components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import NoPermission from 'components/ui/NoPermission'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import type {
  GitHubConnection,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { toast } from 'sonner'
import { IntegrationConnectionItem } from 'components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import GitHubIntegrationConnectionForm from './GitHubIntegrationConnectionForm'

const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-full sm:w-48 mt-6 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const GitHubSection = () => {
  const { ref: projectRef } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()

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

  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: selectedOrganization?.id },
    { enabled: !!projectRef && !!selectedOrganization?.id }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  const { mutate: deleteConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted GitHub connection')
    },
  })

  const isConnected = Boolean(existingConnection)

  const GitHubTitle = `GitHub Integration`

  const openLinkerPanel = () => {
    sidePanelStateSnapshot.setGithubConnectionsOpen(true)
  }

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      if (!selectedOrganization?.id) {
        toast.error('Organization not found')
        return
      }

      deleteConnection({
        connectionId: Number(connection.id),
        organizationId: selectedOrganization.id,
      })
    },
    [deleteConnection, selectedOrganization?.id]
  )

  if (!canReadGitHubConnection) {
    return (
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail title={GitHubTitle}>
            <p>Connect any of your GitHub repositories to a project.</p>
            <IntegrationImageHandler title="github" />
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            <NoPermission resourceText="view this organization's GitHub connections" />
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitHubTitle}>
          <p>Connect any of your GitHub repositories to a project.</p>
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <div className="space-y-6">
            {/* Section 1: GitHub Connection */}
            <div>
              <h5 className="text-foreground mb-2">How does the GitHub integration work?</h5>
              <p className="text-foreground-light text-sm mb-6">
                Connecting to GitHub allows you to sync preview branches with a chosen GitHub
                branch, keep your production branch in sync, and automatically create preview
                branches for every pull request.
              </p>
              {existingConnection ? (
                <ul className="flex flex-col gap-y-2">
                  <IntegrationConnectionItem
                    key={existingConnection.id}
                    disabled={!canUpdateGitHubConnection}
                    connection={{
                      id: String(existingConnection.id),
                      added_by: {
                        id: String(existingConnection.user?.id || ''),
                        primary_email: existingConnection.user?.primary_email || '',
                        username: existingConnection.user?.username || '',
                      },
                      foreign_project_id: String(existingConnection.repository.id),
                      supabase_project_ref: existingConnection.project.ref,
                      organization_integration_id: 'unused',
                      inserted_at: existingConnection.inserted_at,
                      updated_at: existingConnection.updated_at,
                      metadata: {
                        id: String(existingConnection.repository.id),
                        name: existingConnection.repository.name,
                        framework: null,
                      },
                    }}
                    type="GitHub"
                    onDeleteConnection={onDeleteGitHubConnection}
                  />
                </ul>
              ) : (
                <EmptyIntegrationConnection
                  onClick={openLinkerPanel}
                  showNode={false}
                  disabled={!canCreateGitHubConnection}
                >
                  Connect repository
                </EmptyIntegrationConnection>
              )}
            </div>

            {/* Section 2: GitHub Settings Configuration */}
            <div className={!isConnected ? 'opacity-50 pointer-events-none' : ''}>
              <GitHubIntegrationConnectionForm
                connection={
                  existingConnection || {
                    id: 0,
                    inserted_at: '',
                    updated_at: '',
                    branch_limit: 50,
                    installation_id: 0,
                    new_branch_per_pr: false,
                    supabase_changes_only: false,
                    workdir: '',
                    project: {
                      id: 0,
                      name: '',
                      ref: projectRef || '',
                    },
                    repository: {
                      id: 0,
                      name: '',
                    },
                    user: null,
                  }
                }
                disabled={!isConnected || !canUpdateGitHubConnection}
              />
            </div>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default GitHubSection
