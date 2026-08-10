import { useParams } from 'common'
import { useCallback, useMemo } from 'react'

import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useBranchesQuery } from '@/data/branches/branches-query'
import type { Branch } from '@/data/branches/branches-query'
import { useGitHubConfigQuery } from '@/data/config/github-config-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { getAuthConfigDriftSummary } from '@/lib/github-config-drift'
import {
  resolveEffectiveGitHubConfigWithLayers,
  resolveGitHubConfigResponse,
  type GitHubConfigResolvedLayer,
  type GitHubConfigTarget,
} from '@/lib/github-config-effective'
import type { GitHubConfigResponse } from '@/lib/github-config.types'

type SelectedGitHubConfigTarget = Exclude<GitHubConfigTarget, 'development'>
const EMPTY_RESOLVED_LAYERS: GitHubConfigResolvedLayer[] = []

export function getGitBranchName(branch?: Branch): string | undefined {
  return branch?.git_branch?.trim() || (branch?.is_default ? undefined : branch?.name?.trim())
}

export function getGitHubConfigTarget(branch?: Branch): SelectedGitHubConfigTarget {
  return branch && !branch.is_default ? 'preview' : 'production'
}

export function useSelectedGitHubConfig() {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const parentProjectRef = project?.parentRef ?? projectRef
  const shouldLoadBranches = IS_PLATFORM && Boolean(parentProjectRef)
  const { data: branches = [], isPending: branchesPending } = useBranchesQuery(
    { projectRef: parentProjectRef },
    { enabled: shouldLoadBranches }
  )
  const selectedBranch = branches.find((branch) => branch.project_ref === projectRef)
  const gitBranch = getGitBranchName(selectedBranch)
  const target = getGitHubConfigTarget(selectedBranch)
  const selectEffectiveConfig = useCallback(
    (response: GitHubConfigResponse) =>
      resolveGitHubConfigResponse(response, { target, gitBranch }),
    [gitBranch, target]
  )

  return useGitHubConfigQuery(
    { branch: gitBranch },
    { enabled: !shouldLoadBranches || !branchesPending, select: selectEffectiveConfig }
  )
}

export function useSelectedGitHubConfigDrift() {
  const { ref: projectRef } = useParams()
  const projectQuery = useSelectedProjectQuery()
  const project = projectQuery.data
  const parentProjectRef = project?.parentRef ?? projectRef
  const shouldLoad = IS_PLATFORM && Boolean(projectRef) && Boolean(project)

  const branchesQuery = useBranchesQuery({ projectRef: parentProjectRef }, { enabled: shouldLoad })
  const branches = branchesQuery.data ?? []
  const selectedBranch = branches.find((branch) => branch.project_ref === projectRef)
  const gitBranch = getGitBranchName(selectedBranch)
  const target = getGitHubConfigTarget(selectedBranch)
  const queriesEnabled = shouldLoad && branchesQuery.isSuccess

  const authConfigQuery = useAuthConfigQuery(
    { projectRef },
    { enabled: queriesEnabled, staleTime: 30_000 }
  )
  const githubConfigQuery = useGitHubConfigQuery({ branch: gitBranch }, { enabled: queriesEnabled })
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
      getAuthConfigDriftSummary({
        dashboardConfig: authConfigQuery.data,
        githubConfig: effectiveConfigResult?.config,
      }),
    [authConfigQuery.data, effectiveConfigResult?.config]
  )
  const isReady = shouldLoad && authConfigQuery.isSuccess && githubConfigQuery.isSuccess
  const source = githubConfigQuery.data?.source
  const hasSourceBranchFallback =
    gitBranch !== undefined && source !== undefined && source.branch !== gitBranch
  const issueCount = summary.driftedFields.length

  const refetch = () =>
    Promise.all([
      projectQuery.refetch(),
      branchesQuery.refetch(),
      authConfigQuery.refetch(),
      githubConfigQuery.refetch(),
    ])

  return {
    gitBranch,
    requestedGitBranch: gitBranch,
    target,
    source,
    configContent: githubConfigQuery.data?.originalContent,
    resolvedLayers: effectiveConfigResult?.layers ?? EMPTY_RESOLVED_LAYERS,
    hasSourceBranchFallback,
    isReady,
    isPending:
      projectQuery.isPending ||
      (shouldLoad &&
        (branchesQuery.isPending || authConfigQuery.isPending || githubConfigQuery.isPending)),
    isFetching:
      projectQuery.isFetching ||
      (shouldLoad &&
        (branchesQuery.isFetching || authConfigQuery.isFetching || githubConfigQuery.isFetching)),
    isError:
      projectQuery.isError ||
      (shouldLoad &&
        (branchesQuery.isError || authConfigQuery.isError || githubConfigQuery.isError)),
    error:
      projectQuery.error ?? branchesQuery.error ?? authConfigQuery.error ?? githubConfigQuery.error,
    hasDrift: isReady && summary.driftedFields.length > 0,
    hasConfigurationIssues: isReady && issueCount > 0,
    issueCount,
    summary,
    refetch,
  }
}
