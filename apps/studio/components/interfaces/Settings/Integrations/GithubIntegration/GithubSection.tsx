import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { useParams } from 'common'
import {
  ScaffoldDescription,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDescription,
  ScaffoldSectionDetail,
  ScaffoldSectionTitle,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import GitHubIntegrationConnectionForm from './GitHubIntegrationConnectionForm'

const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-full sm:w-32 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const GitHubSection = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { can: canReadGitHubConnection, isLoading: isLoadingPermissions } =
    useAsyncCheckPermissions(PermissionAction.READ, 'integrations.github_connections')

  const isProPlanAndUp = organization?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

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
    <ScaffoldSection isFullWidth>
      <div className="flex items-center gap-6 mb-8">
        <IntegrationImageHandler title="github" />
        <div>
          <ScaffoldSectionTitle>{GitHubTitle}</ScaffoldSectionTitle>
          <ScaffoldSectionDescription className="mb-0 mt-1 max-w-2xl">
            Connect your GitHub repositories to sync preview branches, keep production in sync, and
            automatically create preview branches for pull requests.
          </ScaffoldSectionDescription>
        </div>
      </div>
      <div>
        {isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canReadGitHubConnection ? (
          <NoPermission resourceText="view this organization's GitHub connections" />
        ) : (
          <div>
            {promptProPlanUpgrade && (
              <div className="mb-6">
                <UpgradeToPro
                  primaryText="Upgrade to unlock GitHub integration"
                  secondaryText="Connect your GitHub repository to automatically sync preview branches and deploy changes."
                  source="github-integration"
                />
              </div>
            )}
            <div className={cn(promptProPlanUpgrade && 'opacity-25 pointer-events-none')}>
              <GitHubIntegrationConnectionForm connection={existingConnection} />
            </div>
          </div>
        )}
      </div>
    </ScaffoldSection>
  )
}

export default GitHubSection
