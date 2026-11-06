import type { CustomOAuthProvider } from '@supabase/auth-js'

/** Next plan to upgrade to for more custom providers: Free → Pro, Pro → Team */
export function getNextPlanForCustomProviders(planId: string | undefined): 'Pro' | 'Team' | null {
  if (planId === 'free') return 'Pro'
  if (planId === 'pro') return 'Team'
  return null
}

export const CUSTOM_PROVIDER_TYPE_OPTIONS = [
  { name: 'OIDC', value: 'oidc', icon: null },
  { name: 'OAuth2', value: 'oauth2', icon: null },
]

export const CUSTOM_PROVIDER_ENABLED_OPTIONS = [
  { name: 'Enabled', value: 'true', icon: null },
  { name: 'Disabled', value: 'false', icon: null },
]

export function filterCustomProviders({
  providers,
  searchString,
  providerTypes,
  enabledStatuses,
}: {
  providers: CustomOAuthProvider[]
  searchString: string
  providerTypes: string[]
  enabledStatuses: string[]
}) {
  return providers.filter((provider) => {
    const matchesSearch =
      searchString === '' ||
      provider.name.toLowerCase().includes(searchString.toLowerCase()) ||
      provider.identifier.toLowerCase().includes(searchString.toLowerCase())

    const matchesType = providerTypes.length === 0 || providerTypes.includes(provider.provider_type)

    const matchesEnabled =
      enabledStatuses.length === 0 || enabledStatuses.includes(provider.enabled ? 'true' : 'false')

    return matchesSearch && matchesType && matchesEnabled
  })
}
