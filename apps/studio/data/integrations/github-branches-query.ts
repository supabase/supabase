import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { integrationKeys } from './keys'
import { ResponseError } from 'types'

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

  if (error) throw new Error((error as ResponseError).message)
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
