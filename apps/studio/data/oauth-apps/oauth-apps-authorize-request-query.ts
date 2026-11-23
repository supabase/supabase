import { QueryOptions, queryOptions } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { get, handleError, unguarded } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'

export type OAuthAppsAuthorizeRequestVariables = {
  id?: string
}

async function getOAuthAppsAuthorizeRequest(
  { id }: OAuthAppsAuthorizeRequestVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('Authorization request id is required')

  const { data, error } = await get('/platform/oauth/authorizations/{id}', {
    params: { path: { id } },
    grant: unguarded.byDesign('Only already-approved authorizations should check grants'),
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OAuthAppsAuthorizeRequestData = Awaited<ReturnType<typeof getOAuthAppsAuthorizeRequest>>
export type OAuthAppsAuthorizeRequestError = StudioError

export const getOAuthAppsAuthorizeRequestQueryOptions = (
  { id }: OAuthAppsAuthorizeRequestVariables,
  options?: QueryOptions<
    OAuthAppsAuthorizeRequestData,
    OAuthAppsAuthorizeRequestError,
    OAuthAppsAuthorizeRequestData,
    ReturnType<typeof oauthAppsKeys.authorizeRequest>
  >
) =>
  queryOptions({
    queryKey: oauthAppsKeys.authorizeRequest(id),
    queryFn: ({ signal }) => getOAuthAppsAuthorizeRequest({ id }, signal),
    enabled: id != null,
    ...options,
  })
