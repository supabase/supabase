import { proxy, snapshot, useSnapshot } from 'valtio'

export const githubConnectionConfigPanelState = proxy({
  visible: false as boolean,
  setVisible: (visible: boolean) => {
    githubConnectionConfigPanelState.visible = visible
  },
})

export const getGithubConnectionConfigPanelSnapshot = () =>
  snapshot(githubConnectionConfigPanelState)

export const useGithubConnectionConfigPanelSnapshot = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(githubConnectionConfigPanelState, options)
