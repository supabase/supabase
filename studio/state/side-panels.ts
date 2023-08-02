import types from 'pages/api/pg-meta/[ref]/types'
import { proxy, snapshot, useSnapshot } from 'valtio'

export type SidePanelTypeProps = 'VERCEL_CONNECTIONS' | 'GITHUB_CONNECTIONS'

// export type OpenProps =
//   | { type: 'VERCEL_CONNECTIONS'; integrationId: string }
//   | { type: 'GITHUB_CONNECTIONS'; integrationId: string }

export const sidePanelsState = proxy({
  // setOpen: (type: SidePanelTypeProps, integrationId: string) => {
  //   sidePanelsState.integrationConnections = type
  //   switch (type) {
  //     case 'VERCEL_CONNECTIONS':
  //       sidePanelsState.vercelConnectionsIntegrationId = integrationId
  //       break
  //     case 'GITHUB_CONNECTIONS':
  //       sidePanelsState.githubConnectionsIntegrationId = integrationId
  //       break
  //   }
  // },
  // setClosed: () => {
  //   sidePanelsState.integrationConnections = false
  // },

  // integrationConnections: false as SidePanelTypeProps | false,

  /**
   * Vercel connections
   */
  vercelConnectionsOpen: false as boolean,
  setVercelConnectionsOpen: (bool: boolean) => {
    sidePanelsState.vercelConnectionsOpen = bool
  },
  // ID to determine which vercel integration installation to use
  vercelConnectionsIntegrationId: '' as string,
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
  // ID to determine which github integration installation to use
  githubConnectionsIntegrationId: '' as string,
  setGithubConnectionsIntegrationId: (id: string) => {
    sidePanelsState.githubConnectionsIntegrationId = id
  },
})

export const getSidePanelsState = () => snapshot(sidePanelsState)

export const useSidePanelsStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sidePanelsState, options)
