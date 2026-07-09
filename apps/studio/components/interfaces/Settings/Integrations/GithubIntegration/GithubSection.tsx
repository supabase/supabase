import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IntegrationSectionIcon } from '../IntegrationsSettings'
import { GitHubIntegrationConnectionForm } from './GitHubIntegrationConnectionForm'
import { IntegrationConnectionItem } from '@/components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import { EmptyIntegrationConnection } from '@/components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
import { useGitHubAuthorizationQuery } from '@/data/integrations/github-authorization-query'
import { useGitHubConnectionDeleteMutation } from '@/data/integrations/github-connection-delete-mutation'
import {
  useGitHubConnectionsQuery,
  type GitHubConnection,
} from '@/data/integrations/github-connections-query'
import type { IntegrationProjectConnection } from '@/data/integrations/integrations.types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  GITHUB_INTEGRATION_INSTALLATION_URL,
  GITHUB_INTEGRATION_REVOKE_AUTHORIZATION_URL,
} from '@/lib/github'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const toIntegrationProjectConnection = (
  connection: GitHubConnection
): IntegrationProjectConnection => ({
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
})

export const GitHubSection = ({ isProjectScoped }: { isProjectScoped: boolean }) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const { can: canReadGitHubConnection, isLoading: isLoadingPermissions } =
    useAsyncCheckPermissions(PermissionAction.READ, 'integrations.github_connections')
  const { can: canCreateGitHubConnection } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )
  const { can: canUpdateGitHubConnection } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )

  const { data: gitHubAuthorization } = useGitHubAuthorizationQuery({
    enabled: !isProjectScoped,
  })
  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: org?.id },
    { enabled: isProjectScoped ? !!projectRef && !!org?.id : !!org?.id }
  )

  const { mutate: deleteGitHubConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      toast.success('GitHub connection deleted')
    },
  })

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  const onAddGitHubConnection = useCallback(() => {
    router.push('/project/_/settings/integrations')
  }, [router])

  useShortcut(SHORTCUT_IDS.ORG_INTEGRATIONS_ADD_CONNECTION, onAddGitHubConnection, {
    enabled: !isProjectScoped && canCreateGitHubConnection,
  })

  const description = isProjectScoped
    ? 'Connect this Supabase project to a GitHub repository. Supabase applies database changes when you merge into your production branch. If branching is enabled, each pull request gets its own preview database.'
    : 'Connect GitHub repositories to Supabase projects in this organization. The Supabase GitHub app watches file, branch, and pull request activity in each connected repository.'

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
    <PageSection>
      <PageSectionMeta>
        <div className="flex flex-1 items-start gap-6">
          <IntegrationSectionIcon title="github" />
          <PageSectionSummary>
            <PageSectionTitle>GitHub</PageSectionTitle>
            <PageSectionDescription>{description}</PageSectionDescription>
          </PageSectionSummary>
        </div>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canReadGitHubConnection ? (
          <NoPermission resourceText="view GitHub connections" />
        ) : isProjectScoped ? (
          <GitHubIntegrationConnectionForm connection={existingConnection} />
        ) : (
          <div className="space-y-6">
            <div>
              <ul className="flex flex-col gap-y-2">
                {connections?.map((connection) => (
                  <IntegrationConnectionItem
                    key={connection.id}
                    disabled={!canUpdateGitHubConnection}
                    connection={toIntegrationProjectConnection(connection)}
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

            {gitHubAuthorization && (
              <p className="text-sm text-foreground-light">
                You are authorized with the Supabase GitHub app. You can configure your{' '}
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
      </PageSectionContent>
    </PageSection>
  )
}
