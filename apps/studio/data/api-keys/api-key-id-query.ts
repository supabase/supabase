import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { apiKeysKeys } from './keys'

export interface APIKeyVariables {
  projectRef?: string
  id?: string
  reveal: boolean
}

export async function getAPIKeysById(
  { projectRef, id, reveal }: APIKeyVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('Content ID is required')

  const { data, error } = await get('/v1/projects/{ref}/api-keys/{id}', {
    params: {
      path: { ref: projectRef, id },
      query: { reveal },
    },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type APIKeyIdData = Awaited<ReturnType<typeof getAPIKeysById>>

export const useAPIKeyIdQuery = <TData = APIKeyIdData>(
  { projectRef, id, reveal }: APIKeyVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<APIKeyIdData, ResponseError, TData> = {}
) =>
  useQuery<APIKeyIdData, ResponseError, TData>({
    queryKey: apiKeysKeys.single(projectRef, id),
    queryFn: ({ signal }) => getAPIKeysById({ projectRef, id, reveal }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
