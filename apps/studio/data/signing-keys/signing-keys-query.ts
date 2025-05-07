import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { signingKeysKeys } from './keys'
import type { components } from 'api-types'

export type SigningKeysVariables = {
  projectRef?: string
}

export type SigningKey = components['schemas']['SigningKeyResponse']

export async function getSigningKeys({ projectRef }: SigningKeysVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/v1/projects/{ref}/config/auth/signing-keys`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type SigningKeysData = Awaited<ReturnType<typeof getSigningKeys>>

export const useSigningKeysQuery = <TData = SigningKeysData>(
  { projectRef }: SigningKeysVariables,
  { enabled = true, ...options }: UseQueryOptions<SigningKeysData, ResponseError, TData> = {}
) =>
  useQuery<SigningKeysData, ResponseError, TData>(
    signingKeysKeys.list(projectRef || ''),
    ({ signal }) => getSigningKeys({ projectRef: projectRef || '' }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
