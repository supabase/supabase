import { proxy, snapshot, useSnapshot } from 'valtio'

import { LOCAL_STORAGE_KEYS as COMMON_LOCAL_STORAGE_KEYS, LOCAL_STORAGE_KEYS } from 'common'
type DashboardHistoryType = {
  sql?: string
  editor?: string
}

const EMPTY_DASHBOARD_HISTORY: DashboardHistoryType = {
  sql: undefined,
  editor: undefined,
}

const getInitialState = () => {
  return {
    dashboardHistory: EMPTY_DASHBOARD_HISTORY,
    activeDocsSection: ['introduction'],
    docsLanguage: 'js',
    showProjectApiDocs: false,
    showCreateBranchModal: false,
    showAiSettingsModal: false,
    showConnectDialog: false,
    ongoingQueriesPanelOpen: false,
    mobileMenuOpen: false,
    showSidebar: true,
    showEditorPanel: false,
    lastRouteBeforeVisitingAccountPage: '',
  }
}

export const appState = proxy({
  ...getInitialState(),

  setDashboardHistory: (ref: string, key: 'sql' | 'editor', id: string | undefined) => {
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
  setIsOptedInTelemetry: (value: boolean | null) => {
    appState.isOptedInTelemetry = value === null ? false : value
    if (typeof window !== 'undefined' && value !== null) {
      localStorage.setItem(COMMON_LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT, value.toString())
    }
  },

  isMfaEnforced: false,
  setIsMfaEnforced: (value: boolean) => {
    appState.isMfaEnforced = value
  },

  showCreateBranchModal: false,
  setShowCreateBranchModal: (value: boolean) => {
    appState.showCreateBranchModal = value
  },

  showAiSettingsModal: false,
  setShowAiSettingsModal: (value: boolean) => {
    appState.showAiSettingsModal = value
  },

  showSidebar: true,
  setShowSidebar: (value: boolean) => {
    appState.showSidebar = value
  },

  showOngoingQueriesPanelOpen: false,
  setOnGoingQueriesPanelOpen: (value: boolean) => {
    appState.ongoingQueriesPanelOpen = value
  },

  mobileMenuOpen: false,
  setMobileMenuOpen: (value: boolean) => {
    appState.mobileMenuOpen = value
  },

  lastRouteBeforeVisitingAccountPage: '',
  setLastRouteBeforeVisitingAccountPage: (value: string) => {
    appState.lastRouteBeforeVisitingAccountPage = value
  },
})

export const getAppStateSnapshot = () => snapshot(appState)

export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
