import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'data/api'
import { get } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { ResponseError } from 'types'
import { replicaKeys } from './keys'

export type ReadReplicasVariables = {
  projectRef?: string
}

export type Database = components['schemas']['DatabaseDetailResponse']

export async function getReadReplicas({ projectRef }: ReadReplicasVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/databases`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return data
}

export type ReadReplicasData = Awaited<ReturnType<typeof getReadReplicas>>
export type ReadReplicasError = ResponseError

export const useReadReplicasQuery = <TData = ReadReplicasData>(
  { projectRef }: ReadReplicasVariables,
  { enabled = true, ...options }: UseQueryOptions<ReadReplicasData, ReadReplicasError, TData> = {}
) => {
  const { data } = useProjectDetailQuery({ ref: projectRef })

  return useQuery<ReadReplicasData, ReadReplicasError, TData>(
    replicaKeys.list(projectRef),
    ({ signal }) => getReadReplicas({ projectRef }, signal),
    {
      enabled: enabled && data?.is_read_replicas_enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
}
