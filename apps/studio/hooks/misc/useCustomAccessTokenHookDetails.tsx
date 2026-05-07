import { extractMethod } from 'components/interfaces/Auth/Hooks/hooks.utils'
import { AuthConfigResponse, useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useMemo } from 'react'

function authConfigToCustomAccessTokenHookDetails(authConfig?: AuthConfigResponse) {
  if (!authConfig || !authConfig.HOOK_CUSTOM_ACCESS_TOKEN_ENABLED) {
    return undefined
  }

  return extractMethod(
    authConfig.HOOK_CUSTOM_ACCESS_TOKEN_URI,
    authConfig.HOOK_CUSTOM_ACCESS_TOKEN_SECRETS
  )
}

export function useCustomAccessTokenHookDetails(projectRef: string | undefined) {
  const { data: authConfig } = useAuthConfigQuery({ projectRef })

  return useMemo(() => authConfigToCustomAccessTokenHookDetails(authConfig), [authConfig])
}

export type CustomAccessTokenHookDetails = ReturnType<typeof extractMethod>
