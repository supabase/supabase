import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicaKeys } from './keys'

export type ReadReplicasVariables = {
  projectRef?: string
}

// [Joshen] Temp until fixed from API's end to codegen proper types
export type Database = {
  cloud_provider: string
  connectionString: string
  db_host: string
  db_name: string
  db_port: number
  db_user: string
  identifier: string
  inserted_at: string
  region: string
  restUrl: string
  size: string
  status: string
}

export async function getReadReplicas({ projectRef }: ReadReplicasVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/databases`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return data as unknown as Database[]
}

export type ReadReplicasData = Awaited<ReturnType<typeof getReadReplicas>>
export type ReadReplicasError = ResponseError

export const useReadReplicasQuery = <TData = ReadReplicasData>(
  { projectRef }: ReadReplicasVariables,
  { enabled = true, ...options }: UseQueryOptions<ReadReplicasData, ReadReplicasError, TData> = {}
) =>
  useQuery<ReadReplicasData, ReadReplicasError, TData>(
    replicaKeys.list(projectRef),
    ({ signal }) => getReadReplicas({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
