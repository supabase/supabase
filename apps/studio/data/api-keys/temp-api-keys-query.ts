import { useQuery } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { apiKeysKeys } from './keys'

interface getTemporaryAPIKeyVariables {
  projectRef?: string
  /** In seconds, max: 3600 (an hour) */
  expiry?: number
}

// Used in storage explorer, realtime inspector and OAuth Server apps.
export async function getTemporaryAPIKey(
  { projectRef, expiry = 300 }: getTemporaryAPIKeyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/projects/{ref}/api-keys/temporary', {
    params: {
      path: { ref: projectRef },
      query: {
        authorization_exp: expiry.toString(),
        claims: JSON.stringify({ role: 'service_role' }),
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type TemporaryAPIKeyData = Awaited<ReturnType<typeof getTemporaryAPIKey>>

export const useTemporaryAPIKeyQuery = <TData = TemporaryAPIKeyData>(
  { projectRef, expiry = 300 }: getTemporaryAPIKeyVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TemporaryAPIKeyData, ResponseError, TData> = {}
) => {
  return useQuery<TemporaryAPIKeyData, ResponseError, TData>({
    queryKey: apiKeysKeys.temporary(projectRef),
    queryFn: ({ signal }) => getTemporaryAPIKey({ projectRef, expiry }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchInterval: expiry * 1000, // convert to ms
    ...options,
  })
}
