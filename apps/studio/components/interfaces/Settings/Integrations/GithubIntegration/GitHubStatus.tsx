import { AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'

export const GitHubStatus = () => {
  const { ref: projectRef } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
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
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          href={`/project/${parentProjectRef}/settings/integrations`}
          className="block w-full transition truncate text-sm text-foreground-light hover:text-foreground"
        >
          <div className="w-full flex items-center justify-between">
            <h3 className="text-sm">GitHub Integration</h3>
            <ArrowUpRight strokeWidth={1} className="h-4 w-4" />
          </div>
          <p className="mt-0.5 text-xs text-foreground-lighter flex items-center gap-2">
            {isConnected ? (
              <>
                <Image
                  className="dark:invert"
                  src={`${BASE_PATH}/img/icons/github-icon.svg`}
                  width={16}
                  height={16}
                  alt="GitHub"
                />
                {githubConnection?.repository.name}
              </>
            ) : (
              'Not connected'
            )}
          </p>
        </Link>
      </HoverCardTrigger>

      <HoverCardContent side="right" align="start" className="w-80 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Image
            className="dark:invert"
            src={`${BASE_PATH}/img/icons/github-icon.svg`}
            width={20}
            height={20}
            alt="GitHub"
          />
          <span className="truncate">
            {isConnected ? githubConnection?.repository.name : 'Not connected'}
          </span>
        </div>

        {isConnected ? (
          <div className="flex flex-col gap-2 text-xs text-foreground-light">
            <div className="flex items-center gap-2">
              {hasGitBranchSync ? (
                <CheckCircle2 size={12} className="text-brand-600" />
              ) : (
                <AlertCircle size={12} className="text-warning" />
              )}
              <span>
                {hasGitBranchSync
                  ? `Syncing production (${mainBranch?.git_branch})`
                  : 'Production sync disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasAutomaticBranching ? (
                <CheckCircle2 size={12} className="text-brand-600" />
              ) : (
                <AlertCircle size={12} className="text-warning" />
              )}
              <span>
                {hasAutomaticBranching
                  ? 'Automatically creating branches'
                  : 'Automatic branching disabled'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-foreground-light">Not connected to any repository</p>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
