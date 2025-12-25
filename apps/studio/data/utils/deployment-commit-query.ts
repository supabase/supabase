import { useQuery } from '@tanstack/react-query'
import { fetchHandler } from 'data/fetchers'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'

export async function getDeploymentCommit(signal?: AbortSignal) {
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
    queryFn: ({ signal }) => getDeploymentCommit(signal),
    enabled: IS_PLATFORM && enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  })
