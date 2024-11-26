import { proxy, snapshot, useSnapshot } from 'valtio'

import { SupportedAssistantEntities } from 'components/ui/AIAssistantPanel/AIAssistant.types'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { LOCAL_STORAGE_KEYS as COMMON_LOCAL_STORAGE_KEYS } from 'common'
import type { Message as MessageType } from 'ai/react'

const EMPTY_DASHBOARD_HISTORY: {
  sql?: string
  editor?: string
} = {
  sql: undefined,
  editor: undefined,
}

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
  messages?: MessageType[] | undefined
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

const INITIAL_AI_ASSISTANT: AiAssistantPanelType = {
  open: false,
  messages: undefined,
  sqlSnippets: undefined,
  initialInput: '',
  suggestions: undefined,
  editor: null,
  content: '',
  entity: undefined,
  tables: [],
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

  resetAiAssistantPanel: () => {
    appState.aiAssistantPanel = {
      ...INITIAL_AI_ASSISTANT,
      open: appState.aiAssistantPanel.open,
    }
  },

  aiAssistantPanel: INITIAL_AI_ASSISTANT as AiAssistantPanelType,
  setAiAssistantPanel: (value: Partial<AiAssistantPanelType>) => {
    const hasEntityChanged = value.entity?.id !== appState.aiAssistantPanel.entity?.id

    appState.aiAssistantPanel = {
      ...appState.aiAssistantPanel,
      content: hasEntityChanged ? '' : appState.aiAssistantPanel.content,
      ...value,
    }
  },
})

export const getAppStateSnapshot = () => snapshot(appState)

export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
