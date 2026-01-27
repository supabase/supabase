import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { useGitHubAuthorizationQuery } from '@/data/integrations/github-authorization-query'
import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { GenericSkeletonLoader } from 'ui-patterns'
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

export const GitHubSection = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { can: canReadGitHubConnection, isLoading: isLoadingPermissions } =
    useAsyncCheckPermissions(PermissionAction.READ, 'integrations.github_connections')

  const isProPlanAndUp = organization?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const { data: gitHubAuthorization } = useGitHubAuthorizationQuery()

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
              <div>
                <h5 className="text-foreground mb-2">How does the GitHub integration work?</h5>
                <p className="text-foreground-light text-sm mb-6">
                  Connecting to GitHub allows you to sync preview branches with a chosen GitHub
                  branch, keep your production branch in sync, and automatically create preview
                  branches for every pull request.
                </p>

                {promptProPlanUpgrade && (
                  <div className="mb-6">
                    <UpgradeToPro
                      layout="vertical"
                      source="github-integration"
                      featureProposition="use GitHub integrations"
                      primaryText={`Upgrade to ${!!existingConnection ? 'manage' : 'unlock'} GitHub integration`}
                      secondaryText="Connect your GitHub repository to automatically sync preview branches and deploy changes."
                    />
                  </div>
                )}

                {/* [Joshen] Show connection form if GH has already been authorized OR no GH authorization but on a paid plan */}
                {/* So this shouldn't render if there's no GH authorization and on a free plan */}
                {(!!gitHubAuthorization || !promptProPlanUpgrade) && (
                  <GitHubIntegrationConnectionForm
                    disabled={promptProPlanUpgrade}
                    connection={existingConnection}
                  />
                )}
              </div>
            </div>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
