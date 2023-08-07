import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { integrationKeys } from './keys'
import { ResponseError } from 'types'

export type GithubBranchesVariables = {
  organizationIntegrationId?: string
  repoOwner: string
  repoName: string
}

export async function getGithubBranches(
  { organizationIntegrationId, repoOwner, repoName }: GithubBranchesVariables,
  signal?: AbortSignal
) {
  if (!organizationIntegrationId) throw new Error('Organization integration ID is required')

  const { data, error } = await get(
    `/platform/integrations/github/branches/{organization_integration_id}/{repo_owner}/{repo_name}`,
    {
      params: {
        path: {
          organization_integration_id: organizationIntegrationId,
          repo_owner: repoOwner,
          repo_name: repoName,
        },
      },
      signal,
    }
  )

  if (error) throw error
  return data
}

export type GithubBranchesData = Awaited<ReturnType<typeof getGithubBranches>>
export type GithubBranchesError = ResponseError

export const useGithubBranchesQuery = <TData = GithubBranchesData>(
  { organizationIntegrationId, repoOwner, repoName }: GithubBranchesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<GithubBranchesData, GithubBranchesError, TData> = {}
) =>
  useQuery<GithubBranchesData, GithubBranchesError, TData>(
    integrationKeys.githubBranchesList(organizationIntegrationId, repoOwner, repoName),
    ({ signal }) => getGithubBranches({ organizationIntegrationId, repoOwner, repoName }, signal),
    {
      enabled:
        enabled &&
        typeof organizationIntegrationId !== 'undefined' &&
        typeof repoOwner !== 'undefined' &&
        typeof repoName !== 'undefined',
      ...options,
    }
  )
