import { proxy, snapshot, useSnapshot } from 'valtio'

export const appUiState = proxy({
  showEnableBranchingModal: false,
  showFeaturePreviewModal: false,

  setShowEnableBranchingModal: (value: boolean) => {
    appUiState.showEnableBranchingModal = value
  },
  setShowFeaturePreviewModal: (value: boolean) => {
    appUiState.showFeaturePreviewModal = value
  },
})

export const getAppUiStateSnapshot = () => snapshot(appUiState)

export const useAppUiStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appUiState, options)
