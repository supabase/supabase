import { useQuery } from '@tanstack/react-query'

import { secretsKeys } from './keys'
import type { components } from '@/data/api'
import { get, handleError, unguarded } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

export type SecretsVariables = {
  projectRef?: string
}

export type ProjectSecret = components['schemas']['SecretResponse_Output']

export async function getSecrets({ projectRef }: SecretsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/v1/projects/{ref}/secrets`, {
    params: { path: { ref: projectRef } },
    signal,
    grant: unguarded.migrating,
  })

  if (error) handleError(error)
  return data
}

export type SecretsData = Awaited<ReturnType<typeof getSecrets>>
export type SecretsError = StudioError

export const useSecretsQuery = <TData = SecretsData>(
  { projectRef }: SecretsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<SecretsData, SecretsError, TData> = {}
) =>
  useQuery<SecretsData, SecretsError, TData>({
    queryKey: secretsKeys.list(projectRef),
    queryFn: ({ signal }) => getSecrets({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
