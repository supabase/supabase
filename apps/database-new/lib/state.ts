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

  loginDialogOpen: false,
  setLoginDialogOpen: (value: boolean) => {
    appState.loginDialogOpen = value
  },

  runsLoading: [] as string[],
  setRunsLoading: (value: string[]) => {
    appState.runsLoading = value
  },
})

export const getAppStateSnapshot = () => snapshot(appState)
export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
