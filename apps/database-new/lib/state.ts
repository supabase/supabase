import { proxy, snapshot, useSnapshot } from 'valtio'

export const appState = proxy({
  hideCode: false,
  setHideCode: (value: boolean) => {
    appState.hideCode = value
  },

  selectedCode: '',
  setSelectedCode: (value: string) => {
    appState.selectedCode = value
  },
})

export const getAppStateSnapshot = () => snapshot(appState)
export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
