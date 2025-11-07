import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { integrationKeys } from './keys'

export type GitHubBranchesVariables = {
  connectionId?: number
}

export async function getGitHubBranches(
  { connectionId }: GitHubBranchesVariables,
  signal?: AbortSignal
) {
  if (!connectionId) throw new Error('connectionId is required')

  const { data, error } = await get(`/platform/integrations/github/branches/{connection_id}`, {
    params: { path: { connection_id: connectionId } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type GitHubBranchesData = Awaited<ReturnType<typeof getGitHubBranches>>
export type GitHubBranchesError = ResponseError

export const useGitHubBranchesQuery = <TData = GitHubBranchesData>(
  { connectionId }: GitHubBranchesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<GitHubBranchesData, GitHubBranchesError, TData> = {}
) =>
  useQuery<GitHubBranchesData, GitHubBranchesError, TData>({
    queryKey: integrationKeys.githubBranchesList(connectionId),
    queryFn: ({ signal }) => getGitHubBranches({ connectionId }, signal),
    enabled: enabled && typeof connectionId !== 'undefined',
    ...options,
  })
