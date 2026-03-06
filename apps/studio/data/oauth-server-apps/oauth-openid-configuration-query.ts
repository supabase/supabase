import { useQuery } from '@tanstack/react-query'

import { useProjectEndpointQuery } from 'data/config/project-endpoint-query'
import { handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { useAuthConfigQuery } from '../auth/auth-config-query'
import { oauthServerAppKeys } from './keys'

export type OpenIDConfigurationVariables = {
  projectRef: string | undefined
}

/**
 * OpenID Connect Discovery response
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html
 */
export type OpenIDConfiguration = {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint?: string
  jwks_uri: string
  registration_endpoint?: string
  scopes_supported?: string[]
  response_types_supported?: string[]
  grant_types_supported?: string[]
  subject_types_supported?: string[]
  id_token_signing_alg_values_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  code_challenge_methods_supported?: string[]
}

export async function getOpenIDConfiguration({
  clientEndpoint,
}: {
  clientEndpoint: string | undefined
}): Promise<OpenIDConfiguration> {
  if (!clientEndpoint) throw new Error('Client endpoint is required')

  const response = await fetch(`${clientEndpoint}/auth/v1/.well-known/openid-configuration`)

  if (!response.ok) {
    handleError({ message: `Failed to fetch OpenID configuration: ${response.statusText}` })
  }

  return response.json()
}

export type OpenIDConfigurationData = Awaited<ReturnType<typeof getOpenIDConfiguration>>
export type OpenIDConfigurationError = ResponseError

export const useOpenIDConfigurationQuery = <TData = OpenIDConfigurationData>(
  { projectRef }: OpenIDConfigurationVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OpenIDConfigurationData, OpenIDConfigurationError, TData> = {}
) => {
  const { data: endpointData, isLoading: isEndpointLoading } = useProjectEndpointQuery({
    projectRef,
  })
  const clientEndpoint = endpointData?.endpoint

  const {
    data: authConfig,
    isSuccess: isSuccessConfig,
    isLoading: isAuthConfigLoading,
  } = useAuthConfigQuery({ projectRef })
  const isOAuthServerEnabled = !!authConfig?.OAUTH_SERVER_ENABLED

  const isQueryEnabled =
    enabled &&
    typeof projectRef !== 'undefined' &&
    !!clientEndpoint &&
    isSuccessConfig &&
    isOAuthServerEnabled

  const query = useQuery<OpenIDConfigurationData, OpenIDConfigurationError, TData>({
    queryKey: oauthServerAppKeys.openidConfiguration(projectRef),
    queryFn: () => getOpenIDConfiguration({ clientEndpoint }),
    enabled: isQueryEnabled,
    ...options,
  })

  // Include loading states from dependencies
  const isLoading =
    query.isLoading || isEndpointLoading || isAuthConfigLoading || (!isSuccessConfig && enabled)

  return {
    ...query,
    isLoading,
  }
}
