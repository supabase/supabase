import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type GitHubBranchesVariables = {
  connectionId?: number
}

export async function getGitHubBranches(
  { connectionId }: GitHubBranchesVariables,
  signal?: AbortSignal
) {
  if (!connectionId) throw new Error('connectionId is required')

  const { data, error } = await get(`/platform/integrations/github/branches/{connectionId}`, {
    params: { path: { connectionId } },
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
  }: UseQueryOptions<GitHubBranchesData, GitHubBranchesError, TData> = {}
) =>
  useQuery<GitHubBranchesData, GitHubBranchesError, TData>(
    integrationKeys.githubBranchesList(connectionId),
    ({ signal }) => getGitHubBranches({ connectionId }, signal),
    {
      enabled: enabled && typeof connectionId !== 'undefined',
      ...options,
    }
  )
