import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useCallback, useMemo } from 'react'

import type { Branch } from '@/data/branches/branches-query'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useGitHubConfigQuery } from '@/data/config/github-config-query'
import { projectConfigV2QueryOptions } from '@/data/config/project-config-query'
import { useProjectGitHubConnectionQuery } from '@/data/integrations/github-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { getConfigDriftSummary } from '@/lib/github-config-drift'

function getGitBranchName(branch?: Branch): string | undefined {
  return branch?.git_branch?.trim() || (branch?.is_default ? undefined : branch?.name?.trim())
}

export function useSelectedGitHubConfigDrift() {
  const { ref: projectRef } = useParams()
  const {
    data: project,
    isPending: isProjectPending,
    isFetching: isProjectFetching,
    isError: isProjectError,
    error: projectError,
  } = useSelectedProjectQuery()
  const parentProjectRef = project?.parentRef ?? projectRef
  const shouldLoad = IS_PLATFORM && Boolean(projectRef) && Boolean(project)

  const {
    data: branches = [],
    isPending: isBranchesPending,
    isFetching: isBranchesFetching,
    isError: isBranchesError,
    error: branchesError,
    isSuccess: isBranchesSuccess,
    refetch: branchesRefetch,
  } = useBranchesQuery({ projectRef: parentProjectRef }, { enabled: shouldLoad })
  const {
    data: connection,
    isPending: isConnectionPending,
    isFetching: isConnectionFetching,
    isError: isConnectionError,
    error: connectionError,
    isSuccess: isConnectionSuccess,
    refetch: connectionRefetch,
  } = useProjectGitHubConnectionQuery({ ref: parentProjectRef })
  const hasConnection = connection !== undefined
  const selectedBranch = branches.find((branch) => branch.project_ref === projectRef)
  const gitBranch = getGitBranchName(selectedBranch)
  const queriesEnabled = shouldLoad && isBranchesSuccess && isConnectionSuccess && hasConnection

  const {
    data: projectConfig,
    isPending: isProjectConfigPending,
    isFetching: isProjectConfigFetching,
    isError: isProjectConfigError,
    error: projectConfigError,
    isSuccess: isProjectConfigSuccess,
    refetch: projectConfigRefetch,
  } = useQuery({
    ...projectConfigV2QueryOptions({ projectRef }),
    enabled: queriesEnabled,
    staleTime: 30_000,
  })
  const {
    data: effectiveConfigResult,
    isPending: isGithubConfigPending,
    isFetching: isGithubConfigFetching,
    isError: isGithubConfigError,
    error: githubConfigError,
    isSuccess: isGithubConfigSuccess,
    refetch: githubConfigRefetch,
  } = useGitHubConfigQuery(
    { connectionId: connection?.id, repository: connection?.repository.name, branch: gitBranch },
    { enabled: queriesEnabled }
  )

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

  const summary = useMemo(
    () =>
      getConfigDriftSummary({
        dashboardConfig: projectConfig?.attributes,
        githubConfig: effectiveConfigResult?.config,
      }),
    [projectConfig?.attributes, effectiveConfigResult?.config]
  )
  const isReady = shouldLoad && hasConnection && isProjectConfigSuccess && isGithubConfigSuccess
  const source = effectiveConfigResult?.source
  const hasSourceBranchFallback =
    gitBranch !== undefined && source !== undefined && source.branch !== gitBranch
  const issueCount = summary.driftedFields.length

  return {
    requestedGitBranch: gitBranch,
    source,
    hasSourceBranchFallback,
    isReady,
    isPending:
      isProjectPending ||
      (shouldLoad &&
        (isBranchesPending ||
          isConnectionPending ||
          (hasConnection && (isProjectConfigPending || isGithubConfigPending)))),
    isFetching:
      isProjectFetching ||
      (shouldLoad &&
        (isBranchesFetching ||
          isConnectionFetching ||
          (hasConnection && (isProjectConfigFetching || isGithubConfigFetching)))),
    isError:
      isProjectError ||
      (shouldLoad &&
        (isBranchesError || isConnectionError || isProjectConfigError || isGithubConfigError)),
    error:
      projectError ?? branchesError ?? connectionError ?? projectConfigError ?? githubConfigError,
    hasConfigurationIssues: isReady && issueCount > 0,
    unmanagedFields: summary.unmanagedFields,
    summary,
    refetch,
  }
}
