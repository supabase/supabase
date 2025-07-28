import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { cn } from 'ui'
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

  const canReadGitHubConnection = useCheckPermissions(
    PermissionAction.READ,
    'integrations.github_connections'
  )

  const organization = useSelectedOrganization()
  const isProPlanAndUp = organization?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: selectedOrganization?.id },
    { enabled: !!projectRef && !!selectedOrganization?.id }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  const GitHubTitle = `GitHub Integration`

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
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default GitHubSection
