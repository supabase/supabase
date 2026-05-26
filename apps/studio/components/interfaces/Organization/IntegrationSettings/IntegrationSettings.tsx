import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { GenericSkeletonLoader } from 'ui-patterns'

import { IntegrationConnectionItem } from '../../Integrations/VercelGithub/IntegrationConnection'
import SidePanelVercelProjectLinker from './SidePanelVercelProjectLinker'
import { EmptyIntegrationConnection } from '@/components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { IntegrationImageHandler } from '@/components/interfaces/Settings/Integrations/IntegrationsSettings'
import { VercelSection } from '@/components/interfaces/Settings/Integrations/VercelIntegration/VercelSection'
import {
  ScaffoldContainer,
  ScaffoldContainerLegacy,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
  ScaffoldTitle,
} from '@/components/layouts/Scaffold'
import { InlineLink } from '@/components/ui/InlineLink'
import NoPermission from '@/components/ui/NoPermission'
import { useGitHubAuthorizationQuery } from '@/data/integrations/github-authorization-query'
import { useGitHubConnectionDeleteMutation } from '@/data/integrations/github-connection-delete-mutation'
import {
  useGitHubConnectionsQuery,
  type GitHubConnection,
} from '@/data/integrations/github-connections-query'
import type { IntegrationProjectConnection } from '@/data/integrations/integrations.types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  GITHUB_INTEGRATION_INSTALLATION_URL,
  GITHUB_INTEGRATION_REVOKE_AUTHORIZATION_URL,
} from '@/lib/github'

type GitHubSectionProps = {
  canCreateGitHubConnection: boolean
  canReadGithubConnection: boolean
  canUpdateGitHubConnection: boolean
  connections?: GitHubConnection[]
  isGitHubAuthorized: boolean
  isLoadingPermissions: boolean
  onAddGitHubConnection: () => void
  onDeleteGitHubConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

const GitHubSection = ({
  canCreateGitHubConnection,
  canReadGithubConnection,
  canUpdateGitHubConnection,
  connections,
  isGitHubAuthorized,
  isLoadingPermissions,
  onAddGitHubConnection,
  onDeleteGitHubConnection,
}: GitHubSectionProps) => (
  <ScaffoldContainer>
    <ScaffoldSection className="py-12">
      <ScaffoldSectionDetail title="GitHub Connections">
        <p>Connect any of your GitHub repositories to a project.</p>
        <IntegrationImageHandler title="github" />
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canReadGithubConnection ? (
          <NoPermission resourceText="view this organization's GitHub connections" />
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">
                How do GitHub connections work?
              </h3>
              <p className="text-sm text-foreground-light">
                Connect a GitHub repository to a Supabase project. The GitHub app watches file,
                branch, and pull request activity in your repository.
              </p>
            </div>

            <div>
              <ul className="flex flex-col gap-y-2">
                {connections?.map((connection) => (
                  <IntegrationConnectionItem
                    key={connection.id}
                    disabled={!canUpdateGitHubConnection}
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
                      } as IntegrationProjectConnection['metadata'],
                    }}
                    type="GitHub"
                    onDeleteConnection={onDeleteGitHubConnection}
                  />
                ))}
              </ul>

              <EmptyIntegrationConnection
                onClick={onAddGitHubConnection}
                showNode={false}
                disabled={!canCreateGitHubConnection}
              >
                Add new project connection
              </EmptyIntegrationConnection>
            </div>

            {isGitHubAuthorized && (
              <p className="text-sm text-foreground-light">
                You are authorized with the Supabase GitHub App. You can configure your{' '}
                <InlineLink href={GITHUB_INTEGRATION_INSTALLATION_URL}>
                  GitHub App installations and repository access
                </InlineLink>
                , or{' '}
                <InlineLink href={GITHUB_INTEGRATION_REVOKE_AUTHORIZATION_URL}>
                  revoke your authorization
                </InlineLink>
                .
              </p>
            )}
          </div>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  </ScaffoldContainer>
)

export const IntegrationSettings = () => {
  const router = useRouter()
  const { data: org } = useSelectedOrganizationQuery()

  const showVercelIntegration = useIsFeatureEnabled('integrations:vercel')

  const { can: canReadGithubConnection, isLoading: isLoadingPermissions } =
    useAsyncCheckPermissions(PermissionAction.READ, 'integrations.github_connections')
  const { can: canCreateGitHubConnection } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )
  const { can: canUpdateGitHubConnection } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )

  const { data: gitHubAuthorization } = useGitHubAuthorizationQuery()
  const { data: connections } = useGitHubConnectionsQuery({ organizationId: org?.id })

  const { mutate: deleteGitHubConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted GitHub connection')
    },
  })

  const onAddGitHubConnection = useCallback(() => {
    router.push('/project/_/settings/integrations')
  }, [router])

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      if (!org?.id) {
        toast.error('Organization not found')
        return
      }

      deleteGitHubConnection({
        connectionId: connection.id,
        organizationId: org.id,
      })
    },
    [deleteGitHubConnection, org?.id]
  )

  return (
    <>
      <ScaffoldContainerLegacy>
        <ScaffoldTitle>Integrations</ScaffoldTitle>
      </ScaffoldContainerLegacy>
      <GitHubSection
        canCreateGitHubConnection={canCreateGitHubConnection}
        canReadGithubConnection={canReadGithubConnection}
        canUpdateGitHubConnection={canUpdateGitHubConnection}
        connections={connections}
        isGitHubAuthorized={Boolean(gitHubAuthorization)}
        isLoadingPermissions={isLoadingPermissions}
        onAddGitHubConnection={onAddGitHubConnection}
        onDeleteGitHubConnection={onDeleteGitHubConnection}
      />
      {showVercelIntegration && (
        <>
          <ScaffoldDivider />
          <VercelSection isProjectScoped={false} />
          <SidePanelVercelProjectLinker />
        </>
      )}
    </>
  )
}
