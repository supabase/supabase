import { apiKeysKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

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

export type APIKey = LegacyKeys | SecretKeys | PublishableKeys

export type APIKeysGrant = GrantFor<'get', '/v1/projects/{ref}/api-keys'>
export type RevealedAPIKeysGrant = GrantFor<'get', '/v1/projects/{ref}/api-keys', 'reveal'>

export type APIKeysVariables = {
  projectRef?: string
  grant?: APIKeysGrant
}

export type RevealedAPIKeysVariables = {
  projectRef?: string
  grant?: RevealedAPIKeysGrant
}

/** The wrapper sets the `reveal` query param from the grant's variant. */
async function getAPIKeys(
  { projectRef, grant }: { projectRef: string; grant: APIKeysGrant | RevealedAPIKeysGrant },
  signal?: AbortSignal
) {
  const { data, error } = await get(`/v1/projects/{ref}/api-keys`, {
    params: { path: { ref: projectRef } },
    signal,
    grant,
  })

  if (error) handleError(error)

  // [Jonny]: Overriding the types here since some stuff is not actually nullable or optional
  return data as unknown as APIKey[]
}

export type APIKeysData = Awaited<ReturnType<typeof getAPIKeys>>
export type APIKeysError = StudioError

/** Keys without their secret values (`reveal=false`). Needs a plain grant. */
export const apiKeysQueryOptions = <TData = APIKeysData>(
  { projectRef, grant }: APIKeysVariables,
  options?: GrantedQueryCallerOptions<
    APIKeysData,
    APIKeysError,
    TData,
    ReturnType<typeof apiKeysKeys.list>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: apiKeysKeys.list(projectRef, false),
      queryFn:
        projectRef && grant ? ({ signal }) => getAPIKeys({ projectRef, grant }, signal) : undefined,
    },
    options
  )

/** Keys with their secret values (`reveal=true`). Needs the `reveal` grant. */
export const revealedApiKeysQueryOptions = <TData = APIKeysData>(
  { projectRef, grant }: RevealedAPIKeysVariables,
  options?: GrantedQueryCallerOptions<
    APIKeysData,
    APIKeysError,
    TData,
    ReturnType<typeof apiKeysKeys.list>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: apiKeysKeys.list(projectRef, true),
      queryFn:
        projectRef && grant ? ({ signal }) => getAPIKeys({ projectRef, grant }, signal) : undefined,
    },
    options
  )

const EmptyKey = {
  anonKey: undefined,
  serviceKey: undefined,
  publishableKey: undefined,
  secretKey: undefined,
  allSecretKeys: [],
}

export const getKeys = (apiKeys: APIKey[] = []) => {
  if (!Array.isArray(apiKeys)) {
    return EmptyKey
  }
  const anonKey = apiKeys.find((x) => x.name === 'anon')
  const serviceKey = apiKeys.find((x) => x.name === 'service_role')

  // [Joshen] For now I just want 1 of each, I don't need all
  const publishableKey = apiKeys.find((x) => x.type === 'publishable')
  const secretKey = apiKeys.find((x) => x.type === 'secret')

  const allSecretKeys = apiKeys.filter((x) => x.type === 'secret')

  return { anonKey, serviceKey, publishableKey, secretKey, allSecretKeys }
}
