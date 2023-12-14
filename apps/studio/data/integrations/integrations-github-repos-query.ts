import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type GitHubReposVariables = {
  integrationId: string | undefined
}

// We don't want to fetch more than 1000 repositories, as it's already more than enough.
const MAX_PAGES = 10

export async function getGitHubRepos(
  { integrationId }: GitHubReposVariables,
  signal?: AbortSignal
) {
  if (!integrationId) {
    throw new Error('integrationId is required')
  }

  const repos: Awaited<ReturnType<typeof getSingleGithubReposPage>> = []
  const perPage = 100
  let page = 1

  // This is unfortunate, because we will do redundant API call in case there are exactly 100 results,
  // but the API is returning an array instead of `{ repos: [], total_count: n }`.
  while (true) {
    const reposChunk = await getSingleGithubReposPage(integrationId, perPage, page, signal)
    repos.push(...reposChunk)
    page += 1

    // Stop asking for more data if last request was exhaustive or we reached a limit, .
    if (reposChunk.length < perPage || page > MAX_PAGES) {
      break
    }
  }

  return repos
}

async function getSingleGithubReposPage(
  integrationId: string,
  perPage: number,
  page: number,
  signal?: AbortSignal
) {
  const { data, error } = await get(
    '/platform/integrations/github/repos/{organization_integration_id}',
    {
      params: {
        path: {
          organization_integration_id: integrationId,
        },
        query: {
          per_page: perPage,
          page,
        },
      },
      signal,
    }
  )
  if (error) {
    throw error
  }
  return data
}

export type GitHubReposData = Awaited<ReturnType<typeof getGitHubRepos>>
export type GitHubReposError = ResponseError

export const useGitHubReposQuery = <TData = GitHubReposData>(
  { integrationId }: GitHubReposVariables,
  { enabled = true, ...options }: UseQueryOptions<GitHubReposData, GitHubReposError, TData> = {}
) =>
  useQuery<GitHubReposData, GitHubReposError, TData>(
    integrationKeys.githubRepoList(integrationId),
    ({ signal }) => getGitHubRepos({ integrationId }, signal),
    {
      enabled: enabled && typeof integrationId !== 'undefined',
      ...options,
    }
  )
