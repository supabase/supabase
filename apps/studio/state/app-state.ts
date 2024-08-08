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
  selectedFeaturePreview: '',
  setSelectedFeaturePreview: (value: string) => {
    appState.selectedFeaturePreview = value
  },
  showAiSettingsModal: false,
  setShowAiSettingsModal: (value: boolean) => {
    appState.showAiSettingsModal = value
  },

  navigationPanelOpen: false,
  navigationPanelJustClosed: false,
  setNavigationPanelOpen: (value: boolean, trackJustClosed: boolean = false) => {
    if (value === false) {
      // If closing navigation panel by clicking on icon/button, nav bar should not open again until mouse leaves nav bar
      if (trackJustClosed) {
        appState.navigationPanelOpen = false
        appState.navigationPanelJustClosed = true
      } else {
        // If closing navigation panel by leaving nav bar, nav bar can open again when mouse re-enter
        appState.navigationPanelOpen = false
        appState.navigationPanelJustClosed = false
      }
    } else {
      // If opening nav panel, check if it was just closed by a nav icon/button click
      // If yes, do not open nav panel, otherwise open as per normal
      if (appState.navigationPanelJustClosed === false) {
        appState.navigationPanelOpen = true
      }
    }
  },
  setNavigationPanelJustClosed: (value: boolean) => {
    appState.navigationPanelJustClosed = value
  },
})

export const getAppStateSnapshot = () => snapshot(appState)

export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
