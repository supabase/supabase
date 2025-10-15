import { SupabaseClient } from '@supabase/supabase-js'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppsVariables = {
  projectRef?: string
  supabaseClient?: SupabaseClient<any>
}

export type OAuthApp = components['schemas']['OAuthAppResponse']

export async function getOAuthServerApps({ projectRef, supabaseClient }: OAuthServerAppsVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!supabaseClient) throw new Error('Supabase client is required')

  const { data, error } = await supabaseClient.auth.admin.oauth.listClients()

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
  }: UseQueryOptions<OAuthServerAppsData, OAuthServerAppsError, TData> = {}
) => {
  return useQuery({
    queryKey: oauthServerAppKeys.list(projectRef),
    queryFn: () => getOAuthServerApps({ projectRef, supabaseClient }),
    enabled: enabled && typeof projectRef !== 'undefined' && !!supabaseClient,
    ...options,
  })
}
