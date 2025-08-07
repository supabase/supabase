import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { apiKeysKeys } from './keys'

interface getTemporaryAPIKeyVariables {
  projectRef?: string
}

export async function getTemporaryAPIKey(
  { projectRef }: getTemporaryAPIKeyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/projects/{ref}/api-keys/temporary', {
    params: {
      path: { ref: projectRef },
      query: { authorization_exp: '300', claims: JSON.stringify({ role: 'service_role' }) },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type TemporaryAPIKeyData = Awaited<ReturnType<typeof getTemporaryAPIKey>>

export const useTemporaryAPIKeyQuery = <TData = TemporaryAPIKeyData>(
  { projectRef }: getTemporaryAPIKeyVariables,
  { enabled, ...options }: UseQueryOptions<TemporaryAPIKeyData, ResponseError, TData> = {}
) =>
  useQuery<TemporaryAPIKeyData, ResponseError, TData>(
    apiKeysKeys.tempKey(projectRef),
    ({ signal }) => getTemporaryAPIKey({ projectRef }, signal),
    {
      enabled: IS_PLATFORM && enabled && !!projectRef,
      ...options,
    }
  )
