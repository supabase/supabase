import { queryOptions } from '@tanstack/react-query'

import { resourceKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'

export type ApiAuthorizationPreflightVariables = {
  slug?: string
  id?: string
}

type PreflightRole = { name: string }

export type ApiAuthorizationValidationFailure =
  | { scope_target: 'organization'; role: PreflightRole }
  | { scope_target: 'all_projects'; role: PreflightRole; failed_scopes: string[] }
  | {
      scope_target: 'projects'
      failures: { ref: string; role: PreflightRole; failed_scopes: string[] }[]
    }

export type ApiAuthorizationPreflightResponse = {
  existing_grant: object | null
  validation_failure: ApiAuthorizationValidationFailure | null
}

export type ApiAuthorizationPreflightError = StudioError

// Preflight route isn't in the generated API types yet
const getUntyped = get as unknown as (
  url: string,
  init: { params: { path: Record<string, string> }; signal?: AbortSignal }
) => Promise<{ data?: unknown; error?: unknown }>

async function getApiAuthorizationPreflight(
  { slug, id }: ApiAuthorizationPreflightVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('Organization slug is required')
  if (!id) throw new Error('Authorization ID is required')

  const { data, error } = await getUntyped(
    '/platform/organizations/{slug}/oauth/authorizations/{id}/preflight',
    { params: { path: { slug, id } }, signal }
  )

  if (error) handleError(error)
  return data as ApiAuthorizationPreflightResponse
}

export type ApiAuthorizationPreflightData = ApiAuthorizationPreflightResponse

export const apiAuthorizationPreflightQueryOptions = ({
  slug,
  id,
}: ApiAuthorizationPreflightVariables) =>
  queryOptions({
    queryKey: resourceKeys.preflight(slug, id),
    queryFn: ({ signal }) => getApiAuthorizationPreflight({ slug, id }, signal),
    enabled: !!slug && !!id,
  })
