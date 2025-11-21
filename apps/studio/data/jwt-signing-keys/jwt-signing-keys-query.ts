import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { jwtSigningKeysKeys } from './keys'

export type JWTSigningKey = components['schemas']['SigningKeyResponse']

export type JWTAlgorithm = components['schemas']['SigningKeyResponse']['algorithm']

interface JWTSigningKeysVariables {
  projectRef?: string
}

async function getJWTSigningKeys({ projectRef }: JWTSigningKeysVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/config/auth/signing-keys`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type JWTSigningKeysData = Awaited<ReturnType<typeof getJWTSigningKeys>>

export const useJWTSigningKeysQuery = <TData = JWTSigningKeysData>(
  { projectRef }: JWTSigningKeysVariables,
  { enabled, ...options }: UseCustomQueryOptions<JWTSigningKeysData, ResponseError, TData> = {}
) =>
  useQuery<JWTSigningKeysData, ResponseError, TData>({
    queryKey: jwtSigningKeysKeys.list(projectRef),
    queryFn: ({ signal }) => getJWTSigningKeys({ projectRef }, signal),
    enabled: enabled && !!projectRef,
    ...options,
  })
