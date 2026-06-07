import { useProjectSettingsV2Query } from './project-settings-v2-query'
import { useCustomDomainsQuery } from '@/data/custom-domains/custom-domains-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'

export const useProjectApiUrl = (
  { projectRef }: { projectRef?: string },
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const { data } = useProjectAddonsQuery({ projectRef }, { enabled })
  // [console fork] selected_addons can be undefined before the addons query resolves (or
  // when it returns a minimal payload on self-host) — guard the .find() so the global
  // Connect sheet / API-url hook doesn't crash the whole project page.
  const hasCustomDomainsAddon = !!data?.selected_addons?.find((x) => x.type === 'custom_domain')

  const {
    data: customDomainData,
    error: customDomainsError,
    isPending: isLoadingCustomDomains,
    isSuccess: isSuccessCustomDomains,
    isError: isErrorCustomDomains,
  } = useCustomDomainsQuery({ projectRef }, { enabled })
  const isCustomDomainsActive = customDomainData?.customDomain?.status === 'active'
  const customEndpoint =
    hasCustomDomainsAddon && isCustomDomainsActive
      ? `https://${customDomainData?.customDomain?.hostname}`
      : undefined

  const {
    data: settings,
    error: projectSettingsError,
    isPending: isLoadingProjectSettings,
    isSuccess: isSuccessProjectSettings,
    isError: isErrorProjectSettings,
  } = useProjectSettingsV2Query({ projectRef }, { enabled })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint

  const hostEndpoint =
    isSuccessProjectSettings && endpoint ? `${protocol}://${endpoint}` : undefined
  const resolvedEndpoint = isCustomDomainsActive ? customEndpoint : hostEndpoint
  const storageEndpoint = settings?.app_config?.storage_endpoint
    ? // [console fork] use the project's actual protocol (kong is http on shared infra),
      // don't force https just because we're in platform mode.
      `${protocol}://${settings?.app_config?.storage_endpoint}`
    : undefined

  return {
    data: resolvedEndpoint,
    customEndpoint,
    hostEndpoint,
    storageEndpoint,
    error: projectSettingsError || (hasCustomDomainsAddon ? customDomainsError : undefined),
    isPending: isLoadingProjectSettings || (hasCustomDomainsAddon && isLoadingCustomDomains),
    isSuccess: isSuccessProjectSettings && (!hasCustomDomainsAddon || isSuccessCustomDomains),
    isError: isErrorProjectSettings || (hasCustomDomainsAddon && isErrorCustomDomains),
  }
}
