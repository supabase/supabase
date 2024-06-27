import type { OAuthScope } from '@supabase/shared-types/out/constants'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { API_URL } from 'lib/constants'
import { resourceKeys } from './keys'

export type ApiAuthorizationVariables = {
  id?: string
  slug?: string
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
  { id, slug }: ApiAuthorizationVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('Authorization ID is required')

  // @ts-ignore [Joshen] API codegen is wrong here, needs to be fixed
  const { data, error } = await get('/platform/organizations/{slug}/oauth/authorizations/{id}', {
    params: { path: { slug, id } },
    signal,
  })

  if (error) handleError(error)
  return data as ApiAuthorizationResponse
}

export type ResourceData = Awaited<ReturnType<typeof getApiAuthorizationDetails>>
export type ResourceError = { errorEventId: string; message: string }

export const useApiAuthorizationQuery = <TData = ResourceData>(
  { id, slug }: ApiAuthorizationVariables,
  { enabled = true, ...options }: UseQueryOptions<ResourceData, ResourceError, TData> = {}
) =>
  useQuery<ResourceData, ResourceError, TData>(
    resourceKeys.resource(id),
    ({ signal }) => getApiAuthorizationDetails({ id, slug }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
