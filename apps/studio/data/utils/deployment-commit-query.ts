import { useQuery } from '@tanstack/react-query'

import { fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export async function getDeploymentCommit() {
  // Deliberately unpinned: TanStack only adds x-deployment-id to server-function
  // calls (start.ts), and Nitro's session cookie is disabled. This API request
  // sees the latest deployment while older assets stay in the immutable store.
  // Keep the basePath so www routes this request to Studio in production.
  const response = await fetchHandler(`${BASE_PATH}/api/get-deployment-commit`)
  return (await response.json()) as { commitSha: string; commitTime: string }
}

export type DeploymentCommitData = Awaited<ReturnType<typeof getDeploymentCommit>>

export const useDeploymentCommitQuery = <TData = DeploymentCommitData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<DeploymentCommitData, ResponseError, TData> = {}) =>
  useQuery<DeploymentCommitData, ResponseError, TData>({
    queryKey: ['deployment-commit'],
    queryFn: () => getDeploymentCommit(),
    ...options,
  })
