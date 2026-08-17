import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useParams } from 'common'
import { createContext, useContext, type PropsWithChildren } from 'react'

import type { Branch, BranchesData, BranchesError } from '@/data/branches/branches-query'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useGitHubConfigQuery } from '@/data/config/github-config-query'
import {
  projectConfigV2QueryOptions,
  type ProjectConfigV2Data,
  type ProjectConfigV2Error,
} from '@/data/config/project-config-query'
import { useProjectGitHubConnectionQuery } from '@/data/integrations/github-connections-query'
import type { GitHubConnection } from '@/data/integrations/github-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import type { GitHubConfigResponse } from '@/lib/github-config.types'

export type GitHubConfigDriftTarget = 'production' | 'preview'

export function getGitBranchName(branch?: Branch): string | undefined {
  return branch?.git_branch?.trim() || (branch?.is_default ? undefined : branch?.name?.trim())
}

export function getGitHubConfigTarget(branch?: Branch): GitHubConfigDriftTarget {
  return branch && !branch.is_default ? 'preview' : 'production'
}

interface GitHubConfigDriftContextValue {
  projectRef?: string
  parentProjectRef?: string
  gitBranch?: string
  target: GitHubConfigDriftTarget
  shouldLoad: boolean
  hasConnection: boolean
  connection?: GitHubConnection
  projectQuery: ReturnType<typeof useSelectedProjectQuery>
  branchesQuery: UseQueryResult<BranchesData, BranchesError>
  connectionQuery: ReturnType<typeof useProjectGitHubConnectionQuery>
  githubConfigQuery: UseQueryResult<GitHubConfigResponse, Error>
  projectConfigQuery: UseQueryResult<ProjectConfigV2Data, ProjectConfigV2Error>
  refetch: () => Promise<unknown>
}

const GitHubConfigDriftContext = createContext<GitHubConfigDriftContextValue | undefined>(undefined)

/**
 * Fetches a project's GitHub-declared config.toml (via its GitHub connection) and its live,
 * effective service config once per project, so every consumer (drift banner, branch selector
 * indicators, config storage preview, auth-managed-field checks) shares the same cached queries
 * instead of re-deriving the connection/branch lookup and re-fetching independently.
 */
export function GitHubConfigDriftProvider({ children }: PropsWithChildren) {
  const { ref: projectRef } = useParams()
  const projectQuery = useSelectedProjectQuery()
  const project = projectQuery.data
  const parentProjectRef = project?.parentRef ?? projectRef
  const shouldLoad = IS_PLATFORM && Boolean(projectRef) && Boolean(project)

  const branchesQuery = useBranchesQuery({ projectRef: parentProjectRef }, { enabled: shouldLoad })
  const connectionQuery = useProjectGitHubConnectionQuery({ ref: parentProjectRef })
  const connection = connectionQuery.data
  const hasConnection = connection !== undefined
  const branches = branchesQuery.data ?? []
  const selectedBranch = branches.find((branch) => branch.project_ref === projectRef)
  const gitBranch = getGitBranchName(selectedBranch)
  const target = getGitHubConfigTarget(selectedBranch)
  const queriesEnabled =
    shouldLoad && branchesQuery.isSuccess && connectionQuery.isSuccess && hasConnection

  const projectConfigQuery = useQuery({
    ...projectConfigV2QueryOptions({ projectRef }),
    enabled: queriesEnabled,
    staleTime: 30_000,
  })
  const githubConfigQuery = useGitHubConfigQuery(
    { connectionId: connection?.id, repository: connection?.repository.name, branch: gitBranch },
    { enabled: queriesEnabled }
  )

  const refetch = () =>
    Promise.all([
      projectQuery.refetch(),
      branchesQuery.refetch(),
      connectionQuery.refetch(),
      projectConfigQuery.refetch(),
      githubConfigQuery.refetch(),
    ])

  const value: GitHubConfigDriftContextValue = {
    projectRef,
    parentProjectRef,
    gitBranch,
    target,
    shouldLoad,
    hasConnection,
    connection,
    projectQuery,
    branchesQuery,
    connectionQuery,
    githubConfigQuery,
    projectConfigQuery,
    refetch,
  }

  return (
    <GitHubConfigDriftContext.Provider value={value}>{children}</GitHubConfigDriftContext.Provider>
  )
}

export function useGitHubConfigDriftContext() {
  const context = useContext(GitHubConfigDriftContext)
  if (!context) {
    throw new Error('useGitHubConfigDriftContext must be used within a GitHubConfigDriftProvider')
  }
  return context
}
