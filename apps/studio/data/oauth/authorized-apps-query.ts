import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { oauthAppKeys } from './keys'

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

  const { data, error } = await get('/platform/organizations/{slug}/oauth/apps', {
    params: { path: { slug }, query: { type: 'authorized' } },
  })

  if (error) handleError(error)
  return data as AuthorizedApp[]
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
