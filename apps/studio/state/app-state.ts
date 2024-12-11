import { proxy, subscribe, snapshot, useSnapshot } from 'valtio'
import type { Message as MessageType } from 'ai/react'
import { SupportedAssistantEntities } from 'components/ui/AIAssistantPanel/AIAssistant.types'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { LOCAL_STORAGE_KEYS as COMMON_LOCAL_STORAGE_KEYS } from 'common'

export type CommonDatabaseEntity = {
  id: number
  name: string
  schema: string
  [key: string]: any
}

export type SuggestionsType = {
  title: string
  prompts?: string[]
}

type AiAssistantPanelType = {
  open: boolean
  messages: MessageType[]
  initialInput: string
  sqlSnippets?: string[]
  suggestions?: SuggestionsType
  editor?: SupportedAssistantEntities | null
  // Raw string content for the monaco editor, currently used to retain where the user left off when toggling off the panel
  content?: string
  // Mainly used for editing a database entity (e.g editing a function, RLS policy etc)
  entity?: CommonDatabaseEntity
  tables: { schema: string; name: string }[]
}

type DashboardHistoryType = {
  sql?: string
  editor?: string
}

const INITIAL_AI_ASSISTANT: AiAssistantPanelType = {
  open: false,
  messages: [],
  sqlSnippets: undefined,
  initialInput: '',
  suggestions: undefined,
  editor: null,
  content: '',
  entity: undefined,
  tables: [],
}

const EMPTY_DASHBOARD_HISTORY: DashboardHistoryType = {
  sql: undefined,
  editor: undefined,
}

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      aiAssistantPanel: INITIAL_AI_ASSISTANT,
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
      navigationPanelOpen: false,
      navigationPanelJustClosed: false,
      showConnectDialog: false,
    }
  }

  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE)

  const urlParams = new URLSearchParams(window.location.search)
  const aiAssistantPanelOpenParam = urlParams.get('aiAssistantPanelOpen')

  let parsedAiAssistant = INITIAL_AI_ASSISTANT

  try {
    if (stored) {
      parsedAiAssistant = JSON.parse(stored, (key, value) => {
        if (key === 'createdAt' && value) {
          return new Date(value)
        }
        return value
      })
    }
  } catch {
    // Ignore parsing errors
  }

  return {
    aiAssistantPanel: {
      ...parsedAiAssistant,
      open:
        aiAssistantPanelOpenParam !== null
          ? aiAssistantPanelOpenParam === 'true'
          : parsedAiAssistant.open,
    },
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
    navigationPanelOpen: false,
    navigationPanelJustClosed: false,
    showConnectDialog: false,
  }
}

export const appState = proxy({
  ...getInitialState(),

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

  navigationPanelOpen: false,
  navigationPanelJustClosed: false,
  setNavigationPanelOpen: (value: boolean, trackJustClosed: boolean = false) => {
    if (value === false) {
      if (trackJustClosed) {
        appState.navigationPanelOpen = false
        appState.navigationPanelJustClosed = true
      } else {
        appState.navigationPanelOpen = false
        appState.navigationPanelJustClosed = false
      }
    } else {
      if (appState.navigationPanelJustClosed === false) {
        appState.navigationPanelOpen = true
      }
    }
  },
  setNavigationPanelJustClosed: (value: boolean) => {
    appState.navigationPanelJustClosed = value
  },

  resetAiAssistantPanel: () => {
    appState.aiAssistantPanel = {
      ...INITIAL_AI_ASSISTANT,
      open: appState.aiAssistantPanel.open,
    }
  },

  setAiAssistantPanel: (value: Partial<AiAssistantPanelType>) => {
    const hasEntityChanged = value.entity?.id !== appState.aiAssistantPanel.entity?.id

    appState.aiAssistantPanel = {
      ...appState.aiAssistantPanel,
      content: hasEntityChanged ? '' : appState.aiAssistantPanel.content,
      ...value,
    }
  },

  showConnectDialog: false,
  setShowConnectDialog: (value: boolean) => {
    appState.showConnectDialog = value
  },
})

// Set up localStorage subscription
if (typeof window !== 'undefined') {
  subscribe(appState, () => {
    const state = {
      ...appState.aiAssistantPanel,
      // limit to 20 messages so as to not overflow the context window
      messages: appState.aiAssistantPanel.messages?.slice(-20),
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE, JSON.stringify(state))
  })
}

export const getAppStateSnapshot = () => snapshot(appState)

export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
