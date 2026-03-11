import { useQuery } from '@tanstack/react-query'
import { useFeatureFlags, useFlag } from 'common'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { replicaKeys } from './keys'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const MAX_REPLICAS_BELOW_XL = 2
export const MAX_REPLICAS_ABOVE_XL = 5

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

  if (error) handleError(error)
  return data
}

export type ReadReplicasData = Awaited<ReturnType<typeof getReadReplicas>>
export type ReadReplicasError = ResponseError

export const useReadReplicasQuery = <TData = ReadReplicasData>(
  { projectRef }: ReadReplicasVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReadReplicasData, ReadReplicasError, TData> = {}
) => {
  return useQuery<ReadReplicasData, ReadReplicasError, TData>({
    queryKey: replicaKeys.list(projectRef),
    queryFn: ({ signal }) => getReadReplicas({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}

export const usePrimaryDatabase = ({ projectRef }: { projectRef?: string }) => {
  const {
    data: databases = [],
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useReadReplicasQuery({ projectRef })
  const primaryDatabase = databases.find((x) => x.identifier === projectRef)
  return { database: primaryDatabase, error, isLoading, isError, isSuccess }
}

/**
 * [Joshen] JFYI this logic here can and should be optimized
 * Returns the connection string of read replica if available, otherwise default to project's (primary)
 * If multiple read replicas available, (naively) prioritise replica in the same region as primary
 * to minimize any latency. Otherwise just use the first available read replica
 */
export const useConnectionStringForReadOps = (): {
  type: 'replica' | 'primary' | undefined
  identifier: string | undefined
  connectionString: string | undefined | null
} => {
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const defaultToReadReplicaConnectionString = useFlag('defaultToReadReplicaConnectionString')

  const { data: project, isSuccess: isSuccessProject } = useSelectedProjectQuery()
  const { data: databases = [], isLoading: isLoadingDatabases } = useReadReplicasQuery({
    projectRef: project?.ref,
  })

  const readReplicas = databases.filter(
    (x) => x.identifier !== project?.ref && x.status === 'ACTIVE_HEALTHY'
  )
  const readReplica = readReplicas.some((x) => x.region === project?.region)
    ? readReplicas.find((x) => x.region === project?.region)
    : readReplicas[0]

  if (!isSuccessProject || isLoadingDatabases || !flagsLoaded) {
    return { connectionString: undefined, type: undefined, identifier: undefined }
  }

  if (!defaultToReadReplicaConnectionString) {
    return { type: 'primary', identifier: project.ref, connectionString: project.connectionString }
  }

  return {
    type: !!readReplica ? 'replica' : 'primary',
    identifier: !!readReplica ? readReplica.identifier : project.ref,
    connectionString: !!readReplica ? readReplica.connectionString : project.connectionString,
  }
}
