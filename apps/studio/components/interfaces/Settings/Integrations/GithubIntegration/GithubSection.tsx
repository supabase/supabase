import { PermissionAction } from '@supabase/shared-types/out/constants'
import Image from 'next/image'

import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { cn } from 'ui'
import { AutomaticBranchingRow } from './AutomaticBranchingRow'

const GitHubSection = () => {
  const canReadGitHubConnection = useCheckPermissions(
    PermissionAction.READ,
    'integrations.github_connections'
  )

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth className="pb-16">
        <div className="mb-6 flex items-center gap-4">
          <Image
            className={cn('dark:invert')}
            src={`${BASE_PATH}/img/icons/github-icon.svg`}
            width={30}
            height={30}
            alt={`GitHub icon`}
          />
          <div>
            <ScaffoldSectionTitle>GitHub Integration</ScaffoldSectionTitle>
            <ScaffoldDescription>
              Connect any of your GitHub repositories to a project.
            </ScaffoldDescription>
          </div>
        </div>
        {!canReadGitHubConnection ? (
          <NoPermission resourceText="view this organization's GitHub connections" />
        ) : (
          <AutomaticBranchingRow />
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default GitHubSection
