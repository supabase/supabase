import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { secretsKeys } from './keys'
import { ResponseError } from 'types'
import { components } from 'data/api'

export type SecretsVariables = {
  projectRef?: string
}

export type ProjectSecret = components['schemas']['SecretResponse']

export async function getSecrets({ projectRef }: SecretsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/v1/projects/{ref}/secrets`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return data
}

export type SecretsData = Awaited<ReturnType<typeof getSecrets>>
export type SecretsError = ResponseError

export const useSecretsQuery = <TData = SecretsData>(
  { projectRef }: SecretsVariables,
  { enabled = true, ...options }: UseQueryOptions<SecretsData, SecretsError, TData> = {}
) =>
  useQuery<SecretsData, SecretsError, TData>(
    secretsKeys.list(projectRef),
    ({ signal }) => getSecrets({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
