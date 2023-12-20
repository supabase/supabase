import { OAuthScope } from '@supabase/shared-types/out/constants'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { useCallback } from 'react'
import { ResponseError } from 'types'
import { oauthAppKeys } from './keys'

export type OAuthAppsVariables = {
  slug?: string
}

export type OAuthApp = {
  id: string
  icon: string | null
  client_id: string
  client_secret_alias: string
  created_at: string
  name: string
  website: string
  scopes: OAuthScope[]
  redirect_uris: string[]
}

export async function getOAuthApps({ slug }: OAuthAppsVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('Organization slug is required')

  const response = await get(`${API_ADMIN_URL}/organizations/${slug}/oauth/apps?type=published`, {
    signal,
  })
  if (response.error) throw response.error
  return response as OAuthApp[]
}

export type OAuthAppsData = Awaited<ReturnType<typeof getOAuthApps>>
export type OAuthAppsError = ResponseError

export const useOAuthAppsQuery = <TData = OAuthAppsData>(
  { slug }: OAuthAppsVariables,
  { enabled = true, ...options }: UseQueryOptions<OAuthAppsData, OAuthAppsError, TData> = {}
) =>
  useQuery<OAuthAppsData, OAuthAppsError, TData>(
    oauthAppKeys.oauthApps(slug),
    ({ signal }) => getOAuthApps({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )

export const useOAuthAppsPrefetch = ({ slug }: OAuthAppsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (slug) {
      client.prefetchQuery(oauthAppKeys.oauthApps(slug), ({ signal }) =>
        getOAuthApps({ slug }, signal)
      )
    }
  }, [slug])
}
