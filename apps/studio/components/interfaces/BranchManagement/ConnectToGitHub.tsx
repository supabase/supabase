import { useParams } from 'common'
import { Github } from 'lucide-react'
import { useRouter } from 'next/router'
import { Button } from 'ui'

import { useGitHubAuthorizationQuery } from '@/data/integrations/github-authorization-query'
import { useGitHubConnectionsQuery } from '@/data/integrations/github-connections-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { openInstallGitHubIntegrationWindow } from '@/lib/github'
import { useAppStateSnapshot } from '@/state/app-state'

export const ConnectToGitHub = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const { showCreateBranchModal, setShowCreateBranchModal } = useAppStateSnapshot()

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const { data: gitHubAuthorization } = useGitHubAuthorizationQuery()

  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: selectedOrg?.id },
    { enabled: showCreateBranchModal }
  )
  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)

  const showAuthorizeCta = githubConnection && !gitHubAuthorization

  const onClick = () => {
    if (showAuthorizeCta) {
      openInstallGitHubIntegrationWindow('authorize')
    } else {
      if (showCreateBranchModal) setShowCreateBranchModal(false)
      router.push(`/project/${projectRef}/settings/integrations`)
    }
  }

  return (
    <div className="flex items-center gap-2 justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-sm text leading-none">Sync with a GitHub branch</span>
        <p className="text-sm text-foreground-lighter">
          Keep this preview branch in sync with a chosen GitHub branch
        </p>
      </div>
      <Button variant="default" icon={<Github />} onClick={onClick}>
        {showAuthorizeCta ? 'Authorize' : 'Configure'}
      </Button>
    </div>
  )
}
