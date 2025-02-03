import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'

import { components } from 'api-types'
import { apiKeysKeys } from './keys'

type LegacyKeys = {
  api_key: string
  description?: string | null
  hash?: string | null
  id?: string | null
  inserted_at?: string | null
  name: string
  prefix?: string | null
  secret_jwt_template?: components['schemas']['ApiKeySecretJWTTemplate'] | null
  type: 'legacy' | null
  updated_at?: string | null
}

type SecretKeys = {
  api_key: string
  description?: string
  hash: string
  id: string
  inserted_at: string
  name: string
  prefix: string
  secret_jwt_template: components['schemas']['ApiKeySecretJWTTemplate']
  type: 'secret'
  updated_at?: string
}

type PublishableKeys = {
  api_key: string
  description?: string
  hash?: string
  id: string
  inserted_at: string
  name: string
  prefix?: string
  secret_jwt_template?: components['schemas']['ApiKeySecretJWTTemplate'] | null
  type: 'publishable'
  updated_at?: string
}

export interface APIKeysVariables {
  projectRef?: string
  reveal: boolean
}

export async function getAPIKeys({ projectRef, reveal }: APIKeysVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/api-keys`, {
    params: { path: { ref: projectRef }, query: { reveal } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  // [Jonny]: Overriding the types here since some stuff is not actually nullable or optional
  return data as unknown as (LegacyKeys | SecretKeys | PublishableKeys)[]
}

export type APIKeysData = Awaited<ReturnType<typeof getAPIKeys>>

export const useAPIKeysQuery = <TData = APIKeysData>(
  { projectRef, reveal }: APIKeysVariables,
  { enabled, ...options }: UseQueryOptions<APIKeysData, ResponseError, TData> = {}
) =>
  useQuery<APIKeysData, ResponseError, TData>(
    apiKeysKeys.list(projectRef),
    ({ signal }) => getAPIKeys({ projectRef, reveal }, signal),
    {
      enabled: enabled && !!projectRef,
      ...options,
    }
  )
