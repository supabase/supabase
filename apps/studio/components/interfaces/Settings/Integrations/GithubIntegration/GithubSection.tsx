import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useMemo } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IntegrationImageHandler } from '../IntegrationsSettings'
import { GitHubIntegrationConnectionForm } from './GitHubIntegrationConnectionForm'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import NoPermission from '@/components/ui/NoPermission'
import { useGitHubConnectionsQuery } from '@/data/integrations/github-connections-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const GitHubSection = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { can: canReadGitHubConnection, isLoading: isLoadingPermissions } =
    useAsyncCheckPermissions(PermissionAction.READ, 'integrations.github_connections')

  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: organization?.id },
    { enabled: !!projectRef && !!organization?.id }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  const GitHubTitle = `GitHub Integration`

  return (
    <ScaffoldContainer>
      <ScaffoldSection className="py-12">
        <ScaffoldSectionDetail title={GitHubTitle}>
          <p>Connect any of your GitHub repositories to a project.</p>
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isLoadingPermissions ? (
            <GenericSkeletonLoader />
          ) : !canReadGitHubConnection ? (
            <NoPermission resourceText="view this organization's GitHub connections" />
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  How does the GitHub integration work?
                </h3>
                <p className="text-sm text-foreground-light">
                  Connect to GitHub to apply changes to your database when you merge into your
                  production branch. If branching is enabled, each pull request gets its own preview
                  database.
                </p>
              </div>
              <div>
                <GitHubIntegrationConnectionForm connection={existingConnection} />
              </div>
            </div>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
