import { proxy, snapshot, useSnapshot } from 'valtio'

export const githubConnectionConfigPanelState = proxy({
  open: false as boolean,
  setOpen: (open: boolean) => {
    githubConnectionConfigPanelState.open = open
  },
  organizationIntegrationId: undefined as string | undefined,
  setOrganizationIntegrationId: (organizationIntegrationId: string) => {
    githubConnectionConfigPanelState.organizationIntegrationId = organizationIntegrationId
  },
})

export const getGithubConnectionConfigPanelSnapshot = () =>
  snapshot(githubConnectionConfigPanelState)

export const useGithubConnectionConfigPanelSnapshot = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(githubConnectionConfigPanelState, options)
