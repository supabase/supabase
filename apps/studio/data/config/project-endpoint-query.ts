import { IS_PLATFORM } from 'common'

import { useProjectSettingsV2Query } from './project-settings-v2-query'
import { useCustomDomainsQuery } from '@/data/custom-domains/custom-domains-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'

export const useProjectApiUrl = (
  { projectRef }: { projectRef?: string },
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const { data } = useProjectAddonsQuery({ projectRef })
  const hasCustomDomainsAddon = !!data?.selected_addons.find((x) => x.type === 'custom_domain')

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

  const hostEndpoint = isSuccessProjectSettings ? `${protocol}://${endpoint}` : undefined
  const resolvedEndpoint = isCustomDomainsActive ? customEndpoint : hostEndpoint
  const storageEndpoint = settings?.app_config?.storage_endpoint
    ? `${IS_PLATFORM ? 'https' : protocol}://${settings?.app_config?.storage_endpoint}`
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
