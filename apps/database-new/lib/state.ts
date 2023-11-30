import { proxy, snapshot, useSnapshot } from 'valtio'

export const appState = proxy({
  hideCode: false,
  setHideCode: (value: boolean) => {
    appState.hideCode = value
  },

  // check localStorage first
  layout:
    (typeof window !== 'undefined' && window.localStorage.getItem('supabase_db_design_layout')) ||
    'three-col',

  setLayout: (value: string) => {
    appState.layout = value
    localStorage.setItem('supabase_db_design_layout', value)
  },

  selectedCode: '',
  setSelectedCode: (value: string) => {
    appState.selectedCode = value
  },

  loginDialogOpen: false,
  setLoginDialogOpen: (value: boolean) => {
    appState.loginDialogOpen = value
  },
})

export const getAppStateSnapshot = () => snapshot(appState)
export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
