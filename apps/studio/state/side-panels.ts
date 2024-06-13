import { proxy, snapshot, useSnapshot } from 'valtio'

export type SidePanelTypeProps = 'VERCEL_CONNECTIONS' | 'GITHUB_CONNECTIONS'

export const sidePanelsState = proxy({
  /**
   * Vercel connections
   */
  vercelConnectionsOpen: false as boolean,
  setVercelConnectionsOpen: (bool: boolean) => {
    sidePanelsState.vercelConnectionsOpen = bool
  },
  // ID to determine which vercel integration installation to use
  vercelConnectionsIntegrationId: undefined as undefined | string,
  setVercelConnectionsIntegrationId: (id: string) => {
    sidePanelsState.vercelConnectionsIntegrationId = id
  },

  /**
   * GitHub connections
   */
  githubConnectionsOpen: false as boolean,
  setGithubConnectionsOpen: (bool: boolean) => {
    sidePanelsState.githubConnectionsOpen = bool
  },
})

export const getSidePanelsState = () => snapshot(sidePanelsState)

export const useSidePanelsStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sidePanelsState, options)
