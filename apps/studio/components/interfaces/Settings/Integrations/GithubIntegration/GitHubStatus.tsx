import { useRouter } from 'next/router'
import { CheckCircle2, Settings, AlertCircle } from 'lucide-react'
import Image from 'next/image'

import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { Button, Card, CardContent } from 'ui'
import Link from 'next/link'

export const GitHubStatus = () => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const parentProjectRef = selectedProject?.parent_project_ref || projectRef

  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: selectedOrganization?.id },
    { enabled: !!selectedOrganization?.id }
  )

  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    { enabled: !!parentProjectRef }
  )

  const githubConnection = connections?.find(
    (connection) => connection.project.ref === parentProjectRef
  )
  const mainBranch = branches?.find((branch) => branch.is_default)

  const isConnected = Boolean(githubConnection)
  const hasGitBranchSync = Boolean(mainBranch?.git_branch?.trim())
  const hasAutomaticBranching = Boolean(githubConnection?.new_branch_per_pr)

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            className="dark:invert"
            src={`${BASE_PATH}/img/icons/github-icon.svg`}
            width={20}
            height={20}
            alt="GitHub"
          />

          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-foreground">
              {isConnected
                ? `Connected to ${githubConnection?.repository.name}`
                : 'GitHub Integration'}
            </h3>

            <div className="flex items-center gap-4 text-xs text-foreground-light">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-1">
                    {hasGitBranchSync ? (
                      <CheckCircle2 size={12} className="text-brand-600" />
                    ) : (
                      <AlertCircle size={12} className="text-warning-600" />
                    )}
                    <span>
                      {hasGitBranchSync
                        ? `Syncing production (${mainBranch?.git_branch})`
                        : 'Production sync disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasAutomaticBranching ? (
                      <CheckCircle2 size={12} className="text-brand-600" />
                    ) : (
                      <AlertCircle size={12} className="text-warning-600" />
                    )}
                    <span>
                      {hasAutomaticBranching
                        ? 'Automatically creating branches'
                        : 'Automatic branching disabled'}
                    </span>
                  </div>
                </>
              ) : (
                <span>Not connected to any repository</span>
              )}
            </div>
          </div>
        </div>

        <Button asChild type="default" icon={<Settings size={14} />}>
          <Link href={`/project/${projectRef}/settings/integrations`}>Configure</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
