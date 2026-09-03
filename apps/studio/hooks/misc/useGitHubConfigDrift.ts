import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useCallback, useMemo } from 'react'

import {
  fromDashboardProjectConfig,
  getConfigDriftSummary,
} from '@/components/interfaces/ConfigDrift/github-config-drift'
import type { Branch } from '@/data/branches/branches-query'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useGitHubConfigQuery } from '@/data/config/github-config-query'
import { projectConfigV2QueryOptions } from '@/data/config/project-config-query'
import { useProjectGitHubConnectionQuery } from '@/data/integrations/github-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

export function getGitBranchName(branch?: Branch): string | undefined {
  return branch?.git_branch?.trim() || (branch?.is_default ? undefined : branch?.name?.trim())
}

export function useSelectedGitHubConfigDrift() {
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
  const queriesEnabled =
    shouldLoad && branchesQuery.isSuccess && connectionQuery.isSuccess && hasConnection

  const projectConfigQuery = useQuery({
    ...projectConfigV2QueryOptions({ projectRef }),
    enabled: queriesEnabled,
    staleTime: 30_000,
  })
  const githubConfigQuery = useGitHubConfigQuery(
    { connectionId: connection?.id, branch: gitBranch },
    { enabled: queriesEnabled }
  )

  const { refetch: branchesRefetch } = branchesQuery
  const { refetch: connectionRefetch } = connectionQuery
  const { refetch: projectConfigRefetch } = projectConfigQuery
  const { refetch: githubConfigRefetch } = githubConfigQuery

  const refetch = useCallback(
    () =>
      Promise.all([
        branchesRefetch(),
        connectionRefetch(),
        projectConfigRefetch(),
        githubConfigRefetch(),
      ]),
    [branchesRefetch, connectionRefetch, projectConfigRefetch, githubConfigRefetch]
  )

  const summary = useMemo(() => {
    const dashboardConfig = fromDashboardProjectConfig(projectConfigQuery.data?.attributes)
    return getConfigDriftSummary({ dashboardConfig, githubConfig: githubConfigQuery.data?.config })
  }, [projectConfigQuery.data?.attributes, githubConfigQuery.data?.config])

  const activeQueries = [
    projectQuery,
    ...(shouldLoad ? [branchesQuery, connectionQuery] : []),
    ...(shouldLoad && hasConnection ? [projectConfigQuery, githubConfigQuery] : []),
  ]

  const isReady =
    shouldLoad && hasConnection && projectConfigQuery.isSuccess && githubConfigQuery.isSuccess
  const issueCount = summary.driftedFields.length

  return {
    requestedGitBranch: gitBranch,
    isReady,
    isPending: activeQueries.some((query) => query.isPending),
    isFetching: activeQueries.some((query) => query.isFetching),
    isError: activeQueries.some((query) => query.isError),
    error: activeQueries.find((query) => query.error)?.error,
    hasConfigurationIssues: isReady && issueCount > 0,
    summary,
    refetch,
  }
}
