import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { GitHubStatus } from 'components/interfaces/Settings/Integrations/GithubIntegration/GitHubStatus'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { withAuth } from 'hooks/misc/withAuth'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateBranchMenu } from './BranchLayout.utils'

const BranchProductMenu = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()
  const project = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  const hasBranchEnabled = project?.is_branch_enabled

  const page = router.pathname.split('/')[4]

  const { data: connections, isSuccess: isSuccessConnections } = useGitHubConnectionsQuery({
    organizationId: selectedOrg?.id,
  })

  return (
    <>
      <ProductMenu page={page} menu={generateBranchMenu(projectRef)} />
      {isSuccessConnections && hasBranchEnabled && (
        <div className="px-3">
          <h3 className="text-sm font-mono text-foreground-lighter uppercase mx-3 mb-4">
            Configure
          </h3>
          <GitHubStatus />
        </div>
      )}
    </>
  )
}

const BranchLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout
      title="Branching"
      product="Branching"
      productMenu={<BranchProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

/**
 * Layout for all branch pages on the dashboard, wrapped with withAuth to verify logged in state
 *
 * Handles rendering the navigation for each section under the branch pages.
 */
export default withAuth(BranchLayout)
