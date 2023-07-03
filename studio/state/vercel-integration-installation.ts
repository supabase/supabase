import { proxy, snapshot, useSnapshot } from 'valtio'

export const vercelIntegrationInstallationState = proxy({
  selectedOrganizationSlug: '' as string,
  setSelectedOrganizationSlug: (selectedOrganizationSlug: string) => {
    vercelIntegrationInstallationState.selectedOrganizationSlug = selectedOrganizationSlug
  },
})

export const getVercelIntegrationInstallationState = () =>
  snapshot(vercelIntegrationInstallationState)

export const useVercelIntegrationInstallationState = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(vercelIntegrationInstallationState, options)
