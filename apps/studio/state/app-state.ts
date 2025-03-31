import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'

import { LOCAL_STORAGE_KEYS as COMMON_LOCAL_STORAGE_KEYS } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

export type Template = {
  name: string
  description: string
  content: string
}

type EditorPanelType = {
  open: boolean
  initialValue?: string
  label?: string
  saveLabel?: string
  onSave?: (value: string) => void
  functionName?: string
  templates?: Template[]
  initialPrompt?: string
}

type DashboardHistoryType = {
  sql?: string
  editor?: string
}

const INITIAL_EDITOR_PANEL: EditorPanelType = {
  open: false,
  initialValue: '',
  label: '',
  saveLabel: '',
  initialPrompt: '',
  templates: SQL_TEMPLATES.filter((template) => template.type === 'template').map((template) => ({
    name: template.title,
    description: template.description,
    content: template.sql,
  })),
}

const EMPTY_DASHBOARD_HISTORY: DashboardHistoryType = {
  sql: undefined,
  editor: undefined,
}

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      editorPanel: INITIAL_EDITOR_PANEL,
      dashboardHistory: EMPTY_DASHBOARD_HISTORY,
      activeDocsSection: ['introduction'],
      docsLanguage: 'js',
      showProjectApiDocs: false,
      isOptedInTelemetry: false,
      showEnableBranchingModal: false,
      showFeaturePreviewModal: false,
      selectedFeaturePreview: '',
      showAiSettingsModal: false,
      showGenerateSqlModal: false,
      ongoingQueriesPanelOpen: false,
      mobileMenuOpen: false,
      showSidebar: true,
    }
  }

  const storedEditor = localStorage.getItem(LOCAL_STORAGE_KEYS.EDITOR_PANEL_STATE)

  let parsedEditorPanel = INITIAL_EDITOR_PANEL

  try {
    if (storedEditor) {
      parsedEditorPanel = JSON.parse(storedEditor)
    }
  } catch {
    // Ignore parsing errors
  }

  return {
    editorPanel: parsedEditorPanel,
    dashboardHistory: EMPTY_DASHBOARD_HISTORY,
    activeDocsSection: ['introduction'],
    docsLanguage: 'js',
    showProjectApiDocs: false,
    isOptedInTelemetry: false,
    showEnableBranchingModal: false,
    showFeaturePreviewModal: false,
    selectedFeaturePreview: '',
    showAiSettingsModal: false,
    showGenerateSqlModal: false,
    ongoingQueriesPanelOpen: false,
    mobileMenuOpen: false,
    showSidebar: true,
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

  showGenerateSqlModal: false,
  setShowGenerateSqlModal: (value: boolean) => {
    appState.showGenerateSqlModal = value
  },

  showSidebar: true,
  setShowSidebar: (value: boolean) => {
    appState.showSidebar = value
  },

  showOngoingQueriesPanelOpen: false,
  setOnGoingQueriesPanelOpen: (value: boolean) => {
    appState.ongoingQueriesPanelOpen = value
  },

  setEditorPanel: (value: Partial<EditorPanelType>) => {
    // Reset templates to initial if initialValue is empty
    if (value.initialValue === '') {
      value.templates = INITIAL_EDITOR_PANEL.templates
    }

    if (!value.open) {
      value.initialPrompt = INITIAL_EDITOR_PANEL.initialPrompt
    }

    appState.editorPanel = {
      ...appState.editorPanel,
      ...value,
    }
  },

  mobileMenuOpen: false,
  setMobileMenuOpen: (value: boolean) => {
    appState.mobileMenuOpen = value
  },
})

// Set up localStorage subscriptions
if (typeof window !== 'undefined') {
  subscribe(appState, () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.EDITOR_PANEL_STATE,
      JSON.stringify(appState.editorPanel)
    )
  })
}

export const getAppStateSnapshot = () => snapshot(appState)

export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
