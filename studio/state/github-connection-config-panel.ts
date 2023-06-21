import { proxy, snapshot, useSnapshot } from 'valtio'

export const githubConnectionConfigPanelState = proxy({
  open: false as boolean,
  setOpen: (open: boolean) => {
    githubConnectionConfigPanelState.open = open
  },
  organizationIntegrationId: '' as string,
  setOrganizationIntegrationId: (organizationInterationId: string) => {
    githubConnectionConfigPanelState.organizationIntegrationId = organizationInterationId
  },
})

export const getGithubConnectionConfigPanelSnapshot = () =>
  snapshot(githubConnectionConfigPanelState)

export const useGithubConnectionConfigPanelSnapshot = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(githubConnectionConfigPanelState, options)
