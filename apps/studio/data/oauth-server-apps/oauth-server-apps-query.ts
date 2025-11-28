import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { useProjectEndpointQuery } from 'data/config/project-endpoint-query'
import { handleError } from 'data/fetchers'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppsVariables = {
  projectRef: string | undefined
  page?: number
}

const APPS_PER_PAGE = 100

export type OAuthApp = components['schemas']['OAuthAppResponse']

export async function getOAuthServerApps({
  projectRef,
  clientEndpoint,
  page = 1,
}: OAuthServerAppsVariables & { clientEndpoint: string | undefined }) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)

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
  { projectRef }: OAuthServerAppsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OAuthServerAppsData, OAuthServerAppsError, TData> = {}
) => {
  const { data: endpointData } = useProjectEndpointQuery({
    projectRef,
  })
  const clientEndpoint = endpointData?.endpoint

  return useQuery<OAuthServerAppsData, OAuthServerAppsError, TData>({
    queryKey: oauthServerAppKeys.list(projectRef, clientEndpoint),
    queryFn: () => getOAuthServerApps({ projectRef, clientEndpoint }),
    enabled: enabled && typeof projectRef !== 'undefined' && !!clientEndpoint,
    ...options,
  })
}
