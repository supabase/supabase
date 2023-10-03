import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { proxy, snapshot, useSnapshot } from 'valtio'

export const appState = proxy({
  isOptedInTelemetry: false,
  setIsOptedInTelemetry: (value: boolean) => {
    appState.isOptedInTelemetry = value
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT, value.toString())
    }
  },
  showEnableBranchingModal: false,
  setShowEnableBranchingModal: (value: boolean) => {
    appState.showEnableBranchingModal = value
  },
  showFeaturePreviewModal: false,
  setShowFeaturePreviewModal: (value: boolean) => {
    appState.showFeaturePreviewModal = value
  },
})

export const getAppStateSnapshot = () => snapshot(appState)

export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
