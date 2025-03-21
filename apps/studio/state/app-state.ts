import type { Message as MessageType } from 'ai/react'
import { LOCAL_STORAGE_KEYS as COMMON_LOCAL_STORAGE_KEYS } from 'common'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { SupportedAssistantEntities } from 'components/ui/AIAssistantPanel/AIAssistant.types'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'

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

export type Template = {
  name: string
  description: string
  content: string
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
      aiAssistantPanel: INITIAL_AI_ASSISTANT,
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
    }
  }

  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE)
  const storedEditor = localStorage.getItem(LOCAL_STORAGE_KEYS.EDITOR_PANEL_STATE)

  const urlParams = new URLSearchParams(window.location.search)
  const aiAssistantPanelOpenParam = urlParams.get('aiAssistantPanelOpen')

  let parsedAiAssistant = INITIAL_AI_ASSISTANT
  let parsedEditorPanel = INITIAL_EDITOR_PANEL

  try {
    if (stored) {
      parsedAiAssistant = JSON.parse(stored, (key, value) => {
        if (key === 'createdAt' && value) {
          return new Date(value)
        }
        return value
      })
    }
    if (storedEditor) {
      parsedEditorPanel = JSON.parse(storedEditor)
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

  isMfaEnforced: false,
  setIsMfaEnforced: (value: boolean) => {
    appState.isMfaEnforced = value
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

  resetAiAssistantPanel: () => {
    appState.aiAssistantPanel = {
      ...INITIAL_AI_ASSISTANT,
      open: appState.aiAssistantPanel.open,
    }
  },

  setAiAssistantPanel: (value: Partial<AiAssistantPanelType>) => {
    // Close Editor panel if AI Assistant panel is being opened
    if (value.open && appState.editorPanel.open) {
      appState.editorPanel.open = false
    }

    const hasEntityChanged = value.entity?.id !== appState.aiAssistantPanel.entity?.id
    appState.aiAssistantPanel = {
      ...appState.aiAssistantPanel,
      content: hasEntityChanged ? '' : appState.aiAssistantPanel.content,
      ...value,
    }
  },

  saveLatestMessage: (message: any) => {
    appState.aiAssistantPanel = {
      ...appState.aiAssistantPanel,
      messages: [...appState.aiAssistantPanel.messages, message],
    }
  },

  showOngoingQueriesPanelOpen: false,
  setOnGoingQueriesPanelOpen: (value: boolean) => {
    appState.ongoingQueriesPanelOpen = value
  },

  setEditorPanel: (value: Partial<EditorPanelType>) => {
    // Close AI Assistant panel if editor panel is being opened
    if (value.open && appState.aiAssistantPanel.open) {
      appState.aiAssistantPanel.open = false
    }

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
    // Save AI assistant state with limited message history
    const aiAssistantState = {
      ...appState.aiAssistantPanel,
      // limit to 20 messages so as to not overflow the context window
      messages: appState.aiAssistantPanel.messages?.slice(-20),
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE, JSON.stringify(aiAssistantState))

    // Save editor panel state
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.EDITOR_PANEL_STATE,
      JSON.stringify(appState.editorPanel)
    )
  })
}

export const getAppStateSnapshot = () => snapshot(appState)

export const useAppStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appState, options)
