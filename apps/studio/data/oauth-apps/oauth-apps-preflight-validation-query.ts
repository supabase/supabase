import { useQuery, useQueryClient } from '@tanstack/react-query'

import { MAX_RETRY_FAILURE_COUNT } from '../query-client'
import { oauthAppsKeys } from './keys'
import { isOAuthRoleValidationError } from './types'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

export type OAuthAppsPreflightValidationVariables = {
  slug?: string
  auth_id?: string
}

export async function getOAuthAppsPreflightValidation(
  { slug, auth_id }: OAuthAppsPreflightValidationVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('Organization slug is required')
  if (!auth_id) throw new Error('Authorization request id is required')
  const { data, error } = await get(
    '/platform/organizations/{slug}/oauth/authorizations/{id}/preflight',
    {
      params: { path: { slug, id: auth_id } },
      signal,
    }
  )

  if (error && isOAuthRoleValidationError(error)) {
    throw error
  }
  if (error) handleError(error)
  return data
}

export type OAuthAppsPreflightValidationData = Awaited<
  ReturnType<typeof getOAuthAppsPreflightValidation>
>
export type OAuthAppsPreflightValidationError = StudioError

export const useOAuthAppsPreflightValidationQuery = <TData = OAuthAppsPreflightValidationData>(
  { slug, auth_id }: OAuthAppsPreflightValidationVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OAuthAppsPreflightValidationData,
    OAuthAppsPreflightValidationError,
    TData
  > = {}
) => {
  const queryClient = useQueryClient()
  return useQuery<OAuthAppsPreflightValidationData, OAuthAppsPreflightValidationError, TData>({
    queryKey: oauthAppsKeys.preflightValidation(slug, auth_id),
    queryFn: ({ signal }) => getOAuthAppsPreflightValidation({ slug, auth_id }, signal),
    enabled: enabled && Boolean(slug) && Boolean(auth_id),
    retry: (failureCount, error) => {
      if (isOAuthRoleValidationError(error)) return false
      const defaultOptions = queryClient.getDefaultOptions()
      if (defaultOptions.queries?.retry != null) {
        if (typeof defaultOptions.queries.retry === 'function') {
          return defaultOptions.queries.retry(failureCount, error)
        }
        if (typeof defaultOptions.queries.retry === 'number') {
          return failureCount < defaultOptions.queries.retry
        }
        return defaultOptions.queries.retry
      }
      return failureCount < MAX_RETRY_FAILURE_COUNT
    },
    ...options,
  })
}
