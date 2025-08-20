import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicaKeys } from './keys'

export const MAX_REPLICAS_BELOW_XL = 2
export const MAX_REPLICAS_ABOVE_XL = 5

export type ReadReplicasVariables = {
  orgSlug?: string
  projectRef?: string
}

export type Database = components['schemas']['DatabaseDetailResponse']

export async function getReadReplicas({ orgSlug, projectRef }: ReadReplicasVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/databases`, {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef
      }
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ReadReplicasData = Awaited<ReturnType<typeof getReadReplicas>>
export type ReadReplicasError = ResponseError

export const useReadReplicasQuery = <TData = ReadReplicasData>(
  { orgSlug, projectRef }: ReadReplicasVariables,
  { enabled = true, ...options }: UseQueryOptions<ReadReplicasData, ReadReplicasError, TData> = {}
) => {
  return useQuery<ReadReplicasData, ReadReplicasError, TData>(
    replicaKeys.list(orgSlug, projectRef),
    ({ signal }) => getReadReplicas({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
}

export const usePrimaryDatabase = ({ orgSlug, projectRef }: { orgSlug?: string, projectRef?: string }) => {
  const {
    data: databases = [],
    error,
    isLoading,
    isError,
    isSuccess,
  } = useReadReplicasQuery({ orgSlug, projectRef })
  const primaryDatabase = databases.find((x) => x.identifier === projectRef)
  return { database: primaryDatabase, error, isLoading, isError, isSuccess }
}
