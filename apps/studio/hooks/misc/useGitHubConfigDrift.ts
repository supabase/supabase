import { useCallback, useMemo } from 'react'

import { useGitHubConfigDriftContext } from '@/components/layouts/ProjectLayout/GitHubConfigDriftProvider'
import { getConfigDriftSummary } from '@/lib/github-config-drift'
import {
  resolveEffectiveGitHubConfigWithLayers,
  resolveGitHubConfigResponse,
  type GitHubConfigResolvedLayer,
} from '@/lib/github-config-effective'
import type { GitHubConfigResponse } from '@/lib/github-config.types'

const EMPTY_RESOLVED_LAYERS: GitHubConfigResolvedLayer[] = []

export function useSelectedGitHubConfig() {
  const { gitBranch, target, githubConfigQuery } = useGitHubConfigDriftContext()
  const resolveConfig = useCallback(
    (response: GitHubConfigResponse) =>
      resolveGitHubConfigResponse(response, { target, gitBranch }),
    [gitBranch, target]
  )
  const data = useMemo(
    () => (githubConfigQuery.data ? resolveConfig(githubConfigQuery.data) : undefined),
    [githubConfigQuery.data, resolveConfig]
  )

  return { ...githubConfigQuery, data }
}

export function useSelectedGitHubConfigDrift() {
  const {
    gitBranch,
    target,
    shouldLoad,
    hasConnection,
    projectQuery,
    branchesQuery,
    connectionQuery,
    projectConfigQuery,
    githubConfigQuery,
    refetch,
  } = useGitHubConfigDriftContext()

  const effectiveConfigResult = useMemo(
    () =>
      githubConfigQuery.data
        ? resolveEffectiveGitHubConfigWithLayers(githubConfigQuery.data.config, {
            target,
            gitBranch,
          })
        : undefined,
    [gitBranch, githubConfigQuery.data, target]
  )

  const summary = useMemo(
    () =>
      getConfigDriftSummary({
        dashboardConfig: projectConfigQuery.data?.attributes,
        githubConfig: effectiveConfigResult?.config,
      }),
    [projectConfigQuery.data?.attributes, effectiveConfigResult?.config]
  )
  const isReady =
    shouldLoad && hasConnection && projectConfigQuery.isSuccess && githubConfigQuery.isSuccess
  const source = githubConfigQuery.data?.source
  const hasSourceBranchFallback =
    gitBranch !== undefined && source !== undefined && source.branch !== gitBranch
  const issueCount = summary.driftedFields.length

  return {
    gitBranch,
    requestedGitBranch: gitBranch,
    source,
    resolvedLayers: effectiveConfigResult?.layers ?? EMPTY_RESOLVED_LAYERS,
    hasSourceBranchFallback,
    isReady,
    isPending:
      projectQuery.isPending ||
      (shouldLoad &&
        (branchesQuery.isPending ||
          connectionQuery.isPending ||
          (hasConnection && (projectConfigQuery.isPending || githubConfigQuery.isPending)))),
    isFetching:
      projectQuery.isFetching ||
      (shouldLoad &&
        (branchesQuery.isFetching ||
          connectionQuery.isFetching ||
          (hasConnection && (projectConfigQuery.isFetching || githubConfigQuery.isFetching)))),
    isError:
      projectQuery.isError ||
      (shouldLoad &&
        (branchesQuery.isError ||
          connectionQuery.isError ||
          projectConfigQuery.isError ||
          githubConfigQuery.isError)),
    error:
      projectQuery.error ??
      branchesQuery.error ??
      connectionQuery.error ??
      projectConfigQuery.error ??
      githubConfigQuery.error,
    hasDrift: isReady && summary.driftedFields.length > 0,
    hasConfigurationIssues: isReady && issueCount > 0,
    issueCount,
    unmanagedFields: summary.unmanagedFields,
    summary,
    refetch,
  }
}
