import { useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS, useFeatureFlags, useFlag, useParams } from 'common'

import { replicaKeys } from './keys'
import { DashboardPreference } from '@/components/interfaces/Settings/General/DashboardPreferences'
import type { components } from '@/data/api'
import { get, handleError } from '@/data/fetchers'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

/**
 * Unless explicitly defined here, caps default to `READ_REPLICAS_MAX_COUNT`.
 */
export const READ_REPLICA_COMPUTE_CAPS: Record<string, number> = {
  ci_pico: 0,
  ci_nano: 0,
  ci_micro: 0,
  ci_small: 4,
  ci_medium: 4,
  ci_large: 4,
}

export const READ_REPLICAS_MAX_COUNT = 5

export function getMaxReplicas(computeAddon?: string): number {
  return READ_REPLICA_COMPUTE_CAPS[`${computeAddon}`] ?? READ_REPLICAS_MAX_COUNT
}

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
  const { ref: projectRef } = useParams()
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const showDashboardPreferences = useFlag('dashboardPreferences')

  const [dashboardPreferences, , { isLoading: isLoadingLocalStorage }] =
    useLocalStorageQuery<DashboardPreference>(
      LOCAL_STORAGE_KEYS.DASHBOARD_PREFERENCES(projectRef ?? '_'),
      {}
    )

  const { data: project, isSuccess: isSuccessProject } = useSelectedProjectQuery()
  const { data: databases = [], isLoading: isLoadingDatabases } = useReadReplicasQuery({
    projectRef: project?.ref,
  })

  if (!isSuccessProject || isLoadingDatabases || !flagsLoaded || isLoadingLocalStorage) {
    return { connectionString: undefined, type: undefined, identifier: undefined }
  }

  if (!showDashboardPreferences) {
    return { type: 'primary', identifier: project.ref, connectionString: project.connectionString }
  }

  const readReplicas = databases.filter(
    (x) => x.identifier !== project?.ref && x.status === 'ACTIVE_HEALTHY'
  )
  const readReplica = readReplicas.find(
    (x) => x.identifier === dashboardPreferences.defaultDatabase
  )

  return {
    type: !!readReplica ? 'replica' : 'primary',
    identifier: !!readReplica ? readReplica.identifier : project.ref,
    connectionString: !!readReplica ? readReplica.connectionString : project.connectionString,
  }
}
