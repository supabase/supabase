import type { OAuthScope } from '@supabase/shared-types/out/constants'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { resourceKeys } from './keys'

export type ApiAuthorizationVariables = {
  id?: string
}

export type ApiAuthorizationResponse = {
  name: string
  website: string
  icon: string | null
  domain: string
  scopes: OAuthScope[]
  expires_at: string
  approved_at: string | null
  approved_organization_slug?: string
}

export async function getApiAuthorizationDetails(
  { id }: ApiAuthorizationVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('Authorization ID is required')

  const { data, error } = await get('/platform/oauth/authorizations/{id}', {
    params: { path: { id } },
    signal,
  })

  if (error) handleError(error)
  return data as ApiAuthorizationResponse
}

export type ResourceData = Awaited<ReturnType<typeof getApiAuthorizationDetails>>
export type ResourceError = { errorEventId: string; message: string }

export const useApiAuthorizationQuery = <TData = ResourceData>(
  { id }: ApiAuthorizationVariables,
  { enabled = true, ...options }: UseQueryOptions<ResourceData, ResourceError, TData> = {}
) =>
  useQuery<ResourceData, ResourceError, TData>(
    resourceKeys.resource(id),
    ({ signal }) => getApiAuthorizationDetails({ id }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
