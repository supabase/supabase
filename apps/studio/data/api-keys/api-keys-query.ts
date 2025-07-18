import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'

import { IS_PLATFORM } from 'lib/constants'
import { apiKeysKeys } from './keys'

type LegacyKeys = {
  api_key: string
  description?: string | null
  hash?: string | null
  id?: string | null
  inserted_at?: string | null
  name: string
  prefix?: string | null
  secret_jwt_template?: { role: string } | null
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
  secret_jwt_template: { role: string }
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
  secret_jwt_template?: { role: string } | null
  type: 'publishable'
  updated_at?: string
}

interface APIKeysVariables {
  projectRef?: string
  reveal?: boolean
}

type APIKey = LegacyKeys | SecretKeys | PublishableKeys

async function getAPIKeys({ projectRef, reveal }: APIKeysVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/api-keys`, {
    params: { path: { ref: projectRef }, query: { reveal } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  // [Jonny]: Overriding the types here since some stuff is not actually nullable or optional
  return data as unknown as APIKey[]
}

export type APIKeysData = Awaited<ReturnType<typeof getAPIKeys>>

export const useAPIKeysQuery = <TData = APIKeysData>(
  { projectRef, reveal = false }: APIKeysVariables,
  { enabled, ...options }: UseQueryOptions<APIKeysData, ResponseError, TData> = {}
) =>
  useQuery<APIKeysData, ResponseError, TData>(
    apiKeysKeys.list(projectRef, reveal),
    ({ signal }) => getAPIKeys({ projectRef, reveal }, signal),
    {
      enabled: IS_PLATFORM && enabled && !!projectRef,
      ...options,
    }
  )

// [Joshen] Auth team will eventually introduce a "temp API key" which dashboard can use
// to declare supabase clients, so this method to retrieve the keys out of the API keys response
// is temporary. (Otherwise i'd opt to do this by refactoring the data that's returned from
// `getAPIKeys` above instead tbh)
export const getKeys = (apiKeys: APIKey[] = []) => {
  const anonKey = apiKeys.find((x) => x.name === 'anon')
  const serviceKey = apiKeys.find((x) => x.name === 'service_role')

  // [Joshen] For now I just want 1 of each, I don't need all
  const publishableKey = apiKeys.find((x) => x.type === 'publishable')
  const secretKey = apiKeys.find((x) => x.type === 'secret')

  return { anonKey, serviceKey, publishableKey, secretKey }
}
