import { jwtSigningKeysKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

export type LegacyJWTSigningKeyGrant = GrantFor<
  'get',
  '/v1/projects/{ref}/config/auth/signing-keys/legacy'
>

interface LegacyJWTSigningKeyVariables {
  projectRef?: string
  grant?: LegacyJWTSigningKeyGrant
}

/**
 * A 404 means the legacy JWT secret hasn't been imported as a signing key yet, which is a normal
 * state, so it resolves to `null`. Any other failure throws.
 */
async function getLegacyJWTSigningKey(
  { projectRef, grant }: { projectRef: string; grant: LegacyJWTSigningKeyGrant },
  signal?: AbortSignal
) {
  const { data, error } = await get(`/v1/projects/{ref}/config/auth/signing-keys/legacy`, {
    params: { path: { ref: projectRef } },
    signal,
    grant,
  })

  if (error) {
    if ((error as { code?: number }).code === 404) return null
    handleError(error)
  }

  return data ?? null
}

export type LegacyJWTSigningKeyData = Awaited<ReturnType<typeof getLegacyJWTSigningKey>>
export type LegacyJWTSigningKeyError = StudioError

export const legacyJWTSigningKeyQueryOptions = <TData = LegacyJWTSigningKeyData>(
  { projectRef, grant }: LegacyJWTSigningKeyVariables,
  options?: GrantedQueryCallerOptions<
    LegacyJWTSigningKeyData,
    LegacyJWTSigningKeyError,
    TData,
    ReturnType<typeof jwtSigningKeysKeys.legacy>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: jwtSigningKeysKeys.legacy(projectRef),
      queryFn:
        projectRef && grant
          ? ({ signal }) => getLegacyJWTSigningKey({ projectRef, grant }, signal)
          : undefined,
    },
    { retry: false, refetchOnWindowFocus: false, ...options }
  )
