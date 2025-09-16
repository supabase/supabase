import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'

import { jwtSigningKeysKeys } from './keys'

interface LegacyJWTSigningKeyVariables {
  projectRef?: string
}

async function getLegacyJWTSigningKey(
  { projectRef }: LegacyJWTSigningKeyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/config/auth/signing-keys/legacy`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type LegacyJWTSigningKeyData = Awaited<ReturnType<typeof getLegacyJWTSigningKey>>

export const useLegacyJWTSigningKeyQuery = <TData = LegacyJWTSigningKeyData>(
  { projectRef }: LegacyJWTSigningKeyVariables,
  { enabled, ...options }: UseQueryOptions<LegacyJWTSigningKeyData, ResponseError, TData> = {}
) =>
  useQuery<LegacyJWTSigningKeyData, ResponseError, TData>(
    jwtSigningKeysKeys.legacy(projectRef),
    ({ signal }) => getLegacyJWTSigningKey({ projectRef }, signal),
    {
      enabled: enabled && !!projectRef,
      retry: false,
      refetchOnWindowFocus: false,
      ...options,
    }
  )
