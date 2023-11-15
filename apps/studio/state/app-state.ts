import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { proxy, snapshot, useSnapshot } from 'valtio'

const EMPTY_DASHBOARD_HISTORY: {
  sql?: string
  editor?: string
} = {
  sql: undefined,
  editor: undefined,
}

export const appState = proxy({
  // [Joshen] Last visited "entity" for any page that we wanna track
  dashboardHistory: EMPTY_DASHBOARD_HISTORY,
  setDashboardHistory: (ref: string, key: 'sql' | 'editor', id: string) => {
    if (appState.dashboardHistory[key] !== id) {
      appState.dashboardHistory[key] = id
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.DASHBOARD_HISTORY(ref),
        JSON.stringify(appState.dashboardHistory)
      )
    }
  },

  activeDocsSection: ['introduction'],
  docsLanguage: 'js' as 'js' | 'bash',
  showProjectApiDocs: false,
  setShowProjectApiDocs: (value: boolean) => {
    appState.showProjectApiDocs = value
  },
  setActiveDocsSection: (value: string[]) => {
    appState.activeDocsSection = value
  },
  setDocsLanguage: (value: 'js' | 'bash') => {
    appState.docsLanguage = value
  },

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
