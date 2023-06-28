import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { useCallback } from 'react'
import { oauthAppKeys } from './keys'
import { ResponseError } from 'types'

export type AuthorizedAppsVariables = {
  slug?: string
}

export type AuthorizedApp = {
  id: string
  icon: string | null
  name: string
  website: string
  authorized_at: string
}

export async function getAuthorizedApps({ slug }: AuthorizedAppsVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('Organization slug is required')

  const response = await get(`${API_ADMIN_URL}/organizations/${slug}/oauth/apps?type=authorized`, {
    signal,
  })
  if (response.error) throw response.error
  return response as AuthorizedApp[]
}

export type AuthorizedAppsData = Awaited<ReturnType<typeof getAuthorizedApps>>
export type AuthorizedAppsError = ResponseError

export const useAuthorizedAppsQuery = <TData = AuthorizedAppsData>(
  { slug }: AuthorizedAppsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<AuthorizedAppsData, AuthorizedAppsError, TData> = {}
) =>
  useQuery<AuthorizedAppsData, AuthorizedAppsError, TData>(
    oauthAppKeys.authorizedApps(slug),
    ({ signal }) => getAuthorizedApps({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )

export const useAuthorizedAppsPrefetch = ({ slug }: AuthorizedAppsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (slug) {
      client.prefetchQuery(oauthAppKeys.authorizedApps(slug), ({ signal }) =>
        getAuthorizedApps({ slug }, signal)
      )
    }
  }, [slug])
}
