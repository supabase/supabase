import { SupabaseClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppsVariables = {
  projectRef?: string
  supabaseClient?: SupabaseClient<any>
  page?: number
}

const APPS_PER_PAGE = 100

export type OAuthApp = components['schemas']['OAuthAppResponse']

export async function getOAuthServerApps({
  projectRef,
  supabaseClient,
  page = 1,
}: OAuthServerAppsVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!supabaseClient) throw new Error('Supabase client is required')

  const { data, error } = await supabaseClient.auth.admin.oauth.listClients({
    page,
    perPage: APPS_PER_PAGE,
  })

  if (error) handleError(error)
  return data
}

export type OAuthServerAppsData = Awaited<ReturnType<typeof getOAuthServerApps>>
export type OAuthServerAppsError = ResponseError

export const useOAuthServerAppsQuery = <TData = OAuthServerAppsData>(
  { projectRef, supabaseClient }: OAuthServerAppsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OAuthServerAppsData, OAuthServerAppsError, TData> = {}
) => {
  return useQuery({
    queryKey: oauthServerAppKeys.list(projectRef),
    queryFn: () => getOAuthServerApps({ projectRef, supabaseClient }),
    enabled: enabled && typeof projectRef !== 'undefined' && !!supabaseClient,
    ...options,
  })
}
