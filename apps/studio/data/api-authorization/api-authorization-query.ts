import { OAuthScope } from '@supabase/shared-types/out/constants'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
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

  const response = await get(`${API_ADMIN_URL}/oauth/authorizations/${id}`, { signal })
  if (response.error) throw response.error
  return response as ApiAuthorizationResponse
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
