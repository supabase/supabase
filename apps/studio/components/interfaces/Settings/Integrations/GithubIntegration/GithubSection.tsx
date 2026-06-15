import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useMemo } from 'react'
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

  return (
    <PageSection>
      <PageSectionMeta>
        <div className="flex flex-1 items-start gap-6">
          <IntegrationSectionIcon title="github" />
          <PageSectionSummary>
            <PageSectionTitle>GitHub Integration</PageSectionTitle>
            <PageSectionDescription>
              Connect any of your GitHub repositories to a project. Supabase applies database
              changes when you merge into your production branch. If branching is enabled, each pull
              request gets its own preview database.
            </PageSectionDescription>
          </PageSectionSummary>
        </div>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canReadGitHubConnection ? (
          <NoPermission resourceText="view this organization's GitHub connections" />
        ) : (
          <GitHubIntegrationConnectionForm connection={existingConnection} />
        )}
      </PageSectionContent>
    </PageSection>
  )
}
