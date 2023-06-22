import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { useCallback } from 'react'
import { oauthAppKeys } from './keys'
import { ResponseError } from 'types'

export type OAuthAppsVariables = {
  slug?: string
  type?: 'published' | 'authorized'
}

export type OAuthApp = {
  id: string
  client_id: string
  client_secret_alias: string
  created_at: string
  name: string
  website: string
  redirect_uris: string
}

export async function getOAuthApps({ slug, type }: OAuthAppsVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('Organization slug is required')
  if (!type) throw new Error('App type is required')

  const response = await get(`${API_ADMIN_URL}/organizations/${slug}/oauth/apps?type=${type}`, {
    signal,
  })
  if (response.error) throw response.error
  return response as OAuthApp[]
}

export type OAuthAppsData = Awaited<ReturnType<typeof getOAuthApps>>
export type OAuthAppsError = ResponseError

export const useOAuthAppsQuery = <TData = OAuthAppsData>(
  { slug, type }: OAuthAppsVariables,
  { enabled = true, ...options }: UseQueryOptions<OAuthAppsData, OAuthAppsError, TData> = {}
) =>
  useQuery<OAuthAppsData, OAuthAppsError, TData>(
    oauthAppKeys.list(slug, type),
    ({ signal }) => getOAuthApps({ slug, type }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined' && typeof type !== 'undefined',
      ...options,
    }
  )

export const useOAuthAppsPrefetch = ({ slug, type }: OAuthAppsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (slug && type) {
      client.prefetchQuery(oauthAppKeys.list(slug, type), ({ signal }) =>
        getOAuthApps({ slug, type }, signal)
      )
    }
  }, [slug])
}
