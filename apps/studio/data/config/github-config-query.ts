import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { get, handleError } from '@/data/fetchers'
import { gitHubConfigTomlSchema, type GitHubConfigResponse } from '@/lib/github-config.types'
import type { UseCustomQueryOptions } from '@/types'

export type GitHubConfigVariables = {
  connectionId?: number
  repository?: string
  branch?: string
}

export const githubConfigKeys = {
  all: ['github-config'] as const,
  connection: (connectionId?: number, branch?: string) =>
    [...githubConfigKeys.all, connectionId, branch ?? 'default-branch'] as const,
}

const GitHubConnectionConfigResponseSchema = z.object({
  path: z.string(),
  ref: z.string().nullable(),
  config: gitHubConfigTomlSchema.catch({}),
})

export async function getGitHubConfig(
  { connectionId, repository, branch }: GitHubConfigVariables,
  signal?: AbortSignal
): Promise<GitHubConfigResponse> {
  if (!connectionId) throw new Error('connectionId is required')

  const { data, error } = await get(
    '/platform/integrations/github/connections/{connection_id}/config',
    {
      params: {
        path: { connection_id: connectionId },
        query: { ref: branch },
      },
      signal,
    }
  )
  if (error) handleError(error)

  const parsed = GitHubConnectionConfigResponseSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw new Error(
      `Invalid GitHub connection config response: ${first?.message ?? 'Invalid shape'}`
    )
  }

  const { path, ref, config } = parsed.data
  const resolvedBranch = ref ?? branch ?? ''

  return {
    source: {
      repository: repository ?? '',
      branch: resolvedBranch,
      path,
      htmlUrl: repository
        ? `https://github.com/${repository}/blob/${encodeURIComponent(resolvedBranch)}/${path}`
        : null,
    },
    config,
  }
}

export const useGitHubConfigQuery = <TData = GitHubConfigResponse>(
  variables: GitHubConfigVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<GitHubConfigResponse, Error, TData> = {}
) =>
  useQuery<GitHubConfigResponse, Error, TData>({
    queryKey: githubConfigKeys.connection(variables.connectionId, variables.branch),
    queryFn: ({ signal }) => getGitHubConfig(variables, signal),
    enabled: enabled && typeof variables.connectionId !== 'undefined',
    staleTime: 30_000,
    ...options,
  })
