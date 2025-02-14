import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { oauthAppKeys } from './keys'

export type OAuthAppsVariables = {
  slug?: string
}

export type OAuthApp = components['schemas']['OAuthAppResponse']

export async function getOAuthApps({ slug }: OAuthAppsVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/oauth/apps', {
    params: { path: { slug }, query: { type: 'published' } },
  })

  if (error) handleError(error)
  return data
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
