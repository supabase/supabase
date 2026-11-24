import { components } from 'api-types'

import { jwtSigningKeysKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

export type JWTSigningKey = components['schemas']['SigningKeyResponse_Output']
export type JWTAlgorithm = components['schemas']['SigningKeyResponse_Output']['algorithm']

export type JWTSigningKeysGrant = GrantFor<'get', '/v1/projects/{ref}/config/auth/signing-keys'>

interface JWTSigningKeysVariables {
  projectRef?: string
  grant?: JWTSigningKeysGrant
}

async function getJWTSigningKeys(
  { projectRef, grant }: { projectRef: string; grant: JWTSigningKeysGrant },
  signal?: AbortSignal
) {
  const { data, error } = await get(`/v1/projects/{ref}/config/auth/signing-keys`, {
    params: { path: { ref: projectRef } },
    signal,
    grant,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type JWTSigningKeysData = Awaited<ReturnType<typeof getJWTSigningKeys>>
export type JWTSigningKeysError = StudioError

export const jwtSigningKeysQueryOptions = <TData = JWTSigningKeysData>(
  { projectRef, grant }: JWTSigningKeysVariables,
  options?: GrantedQueryCallerOptions<
    JWTSigningKeysData,
    JWTSigningKeysError,
    TData,
    ReturnType<typeof jwtSigningKeysKeys.list>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: jwtSigningKeysKeys.list(projectRef),
      queryFn:
        projectRef && grant
          ? ({ signal }) => getJWTSigningKeys({ projectRef, grant }, signal)
          : undefined,
    },
    options
  )
