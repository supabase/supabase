import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import type { ResponseError } from 'types'
import { replicaKeys } from './keys'
import { components } from 'api-types'

// [Joshen] Is it possible to import this from the code gen?
// https://github.com/supabase/infrastructure/blob/develop/api/src/routes/platform/projects/ref/databases-statuses.dto.ts#L7
export enum ReplicaInitializationStatus {
  'InProgress' = 'in_progress',
  'Completed' = 'completed',
  'Failed' = 'failed',
}

export type DatabaseStatus = components['schemas']['DatabaseStatusResponse']
export type DatabaseInitEstimations = {
  baseBackupDownloadEstimateSeconds: number
  walArchiveReplayEstimateSeconds: number
}

export type ReadReplicasStatusesVariables = {
  projectRef?: string
}

export async function getReadReplicasStatuses(
  { projectRef }: ReadReplicasStatusesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/databases-statuses`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return data
}

export type ReadReplicasStatusesData = Awaited<ReturnType<typeof getReadReplicasStatuses>>
export type ReadReplicasStatusesError = ResponseError

export const useReadReplicasStatusesQuery = <TData = ReadReplicasStatusesData>(
  { projectRef }: ReadReplicasStatusesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReadReplicasStatusesData, ReadReplicasStatusesError, TData> = {}
) => {
  const { data } = useProjectDetailQuery({ ref: projectRef })

  return useQuery<ReadReplicasStatusesData, ReadReplicasStatusesError, TData>(
    replicaKeys.statuses(projectRef),
    ({ signal }) => getReadReplicasStatuses({ projectRef }, signal),
    {
      enabled: enabled && data?.is_read_replicas_enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
}
