import { useQuery } from '@tanstack/react-query'

import { constructHeaders } from '@/data/fetchers'
import type { GitHubConfigErrorResponse, GitHubConfigResponse } from '@/lib/github-config.types'
import type { UseCustomQueryOptions } from '@/types'

export type GitHubConfigVariables = {
  branch?: string
}

export const githubConfigKeys = {
  all: ['github-config'] as const,
  branch: (branch?: string) => [...githubConfigKeys.all, branch ?? 'repository-default'] as const,
}

export async function getGitHubConfig(
  { branch }: GitHubConfigVariables,
  signal?: AbortSignal
): Promise<GitHubConfigResponse> {
  const params = new URLSearchParams()
  if (branch?.trim()) params.set('branch', branch.trim())

  const headers = await constructHeaders({ Accept: 'application/json' })
  const query = params.size > 0 ? `?${params.toString()}` : ''
  const response = await fetch(`/api/github-config${query}`, {
    credentials: 'include',
    headers,
    signal,
  })
  const body = (await response.json()) as GitHubConfigResponse | GitHubConfigErrorResponse

  if (!response.ok) {
    const message =
      'error' in body ? body.error.message : `GitHub config request failed (${response.status})`
    throw new Error(message)
  }

  return body as GitHubConfigResponse
}

export const useGitHubConfigQuery = <TData = GitHubConfigResponse>(
  variables: GitHubConfigVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<GitHubConfigResponse, Error, TData> = {}
) =>
  useQuery<GitHubConfigResponse, Error, TData>({
    queryKey: githubConfigKeys.branch(variables.branch),
    queryFn: ({ signal }) => getGitHubConfig(variables, signal),
    enabled: enabled && typeof window !== 'undefined',
    staleTime: 30_000,
    ...options,
  })

export function isGitHubManagedPath(
  managedPaths: readonly string[] | undefined,
  configPath: string
): boolean {
  return (
    managedPaths?.some(
      (managedPath) => managedPath === configPath || managedPath.startsWith(`${configPath}.`)
    ) === true
  )
}
