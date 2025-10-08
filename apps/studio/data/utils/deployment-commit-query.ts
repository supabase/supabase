import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'

export async function getDeploymentCommit(signal?: AbortSignal) {
  const response = await fetchHandler(`${BASE_PATH}/api/get-deployment-commit`)
  return (await response.json()) as { commitSha: string; commitTime: string }
}

export type DeploymentCommitData = Awaited<ReturnType<typeof getDeploymentCommit>>

export const useDeploymentCommitQuery = <TData = DeploymentCommitData>({
  enabled = true,
  ...options
}: UseQueryOptions<DeploymentCommitData, ResponseError, TData> = {}) =>
  useQuery<DeploymentCommitData, ResponseError, TData>(
    ['deployment-commit'],
    ({ signal }) => getDeploymentCommit(signal),
    {
      ...options,
    }
  )
