import { proxy, snapshot, useSnapshot } from 'valtio'

export const githubIntegrationInstallationState = proxy({
  selectedOrganizationSlug: '' as string,
  setSelectedOrganizationSlug: (selectedOrganizationSlug: string) => {
    githubIntegrationInstallationState.selectedOrganizationSlug = selectedOrganizationSlug
  },
})

export const getGitHubIntegrationInstallationState = () =>
  snapshot(githubIntegrationInstallationState)

export const useGitHubIntegrationInstallationState = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(githubIntegrationInstallationState, options)
