import { AuthError, type CustomOAuthProvider } from '@supabase/auth-js'
import { useQuery } from '@tanstack/react-query'

import { oAuthCustomProvidersKeys } from './keys'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { handleError } from '@/data/fetchers'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthCustomProvidersVariables = {
  projectRef: string | undefined
  page?: number
}

export async function getOAuthCustomProviders({
  projectRef,
  clientEndpoint,
  page = 1,
}: OAuthCustomProvidersVariables & { clientEndpoint: string | undefined }) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)

  const { data, error } = await supabaseClient.auth.admin.customProviders.listProviders()

  if (error) {
    let newError = error
    // Non-JSON responses from the API indicate custom providers aren't enabled.
    // Different browsers/SDK versions produce different JSON parse error messages,
    // so we check broadly for JSON parse indicators.
    if (/JSON\.parse|Unexpected token|unexpected.*character/i.test(newError.message)) {
      newError = new AuthError('Custom providers are not enabled for this project')
    }
    handleError(newError)
  }
  return data.providers as CustomOAuthProvider[]
}

export type OAuthCustomProvidersData = Awaited<ReturnType<typeof getOAuthCustomProviders>>
export type OAuthCustomProvidersError = ResponseError

export const useOAuthCustomProvidersQuery = <TData = OAuthCustomProvidersData>(
  { projectRef }: OAuthCustomProvidersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OAuthCustomProvidersData, OAuthCustomProvidersError, TData> = {}
) => {
  const { hostEndpoint: clientEndpoint } = useProjectApiUrl({ projectRef })
  const { data: authConfig, isSuccess: isSuccessConfig } = useAuthConfigQuery({ projectRef })
  const isOAuthCustomProvidersEnabled = !!authConfig?.CUSTOM_OAUTH_ENABLED

  return useQuery<OAuthCustomProvidersData, OAuthCustomProvidersError, TData>({
    queryKey: oAuthCustomProvidersKeys.list(projectRef, clientEndpoint),
    queryFn: () => getOAuthCustomProviders({ projectRef, clientEndpoint }),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      !!clientEndpoint &&
      isSuccessConfig &&
      isOAuthCustomProvidersEnabled,
    ...options,
  })
}
