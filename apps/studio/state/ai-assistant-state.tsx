import type { Message as MessageType } from 'ai/react'
import { DBSchema, IDBPDatabase, openDB } from 'idb'
import { debounce } from 'lodash'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

type SuggestionsType = {
  title: string
  prompts?: { label: string; description: string }[]
}

export type AssistantMessageType = MessageType & { results?: { [id: string]: any[] } }

export type SqlSnippet = string | { label: string; content: string }

type ChatSession = {
  id: string
  name: string
  messages: AssistantMessageType[]
  createdAt: Date
  updatedAt: Date
}

type AiAssistantData = {
  open: boolean
  initialInput: string
  sqlSnippets?: SqlSnippet[]
  suggestions?: SuggestionsType
  tables: { schema: string; name: string }[]
  chats: Record<string, ChatSession>
  activeChatId?: string
}

// Data structure stored in IndexedDB
type StoredAiAssistantState = {
  projectRef: string
  open: boolean
  activeChatId?: string
  chats: Record<string, ChatSession>
}

const INITIAL_AI_ASSISTANT: AiAssistantData = {
  open: false,
  initialInput: '',
  sqlSnippets: undefined,
  suggestions: undefined,
  tables: [],
  chats: {},
  activeChatId: undefined,
}

const DB_NAME = 'ai-assistant-db'
const DB_VERSION = 1
const STORE_NAME = 'assistantState'

interface AiAssistantDB extends DBSchema {
  [STORE_NAME]: {
    key: string
    value: StoredAiAssistantState
  }
}

async function openAiDb(): Promise<IDBPDatabase<AiAssistantDB>> {
  return openDB<AiAssistantDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'projectRef' })
      }
    },
  })
}

async function getAiState(projectRef: string): Promise<StoredAiAssistantState | undefined> {
  if (!projectRef) return undefined
  try {
    const db = await openAiDb()
    return await db.get(STORE_NAME, projectRef)
  } catch (error) {
    console.error('Failed to get AI state from IndexedDB:', error)
    return undefined
  }
}

async function saveAiState(state: StoredAiAssistantState): Promise<void> {
  if (!state.projectRef) return
  try {
    const db = await openAiDb()
    await db.put(STORE_NAME, state)
  } catch (error) {
    console.error('Failed to save AI state to IndexedDB:', error)
  }
}

async function clearStorage(): Promise<void> {
  try {
    const db = await openAiDb()
    await db.clear(STORE_NAME)
  } catch (error) {
    console.error('Failed to clear AI state from IndexedDB:', error)
  }
}

// Helper function to load state from IndexedDB
async function loadFromIndexedDB(projectRef: string): Promise<StoredAiAssistantState | null> {
  try {
    const persistedState = await getAiState(projectRef)
    if (persistedState) {
      // Revive dates
      Object.values(persistedState.chats).forEach((chat: ChatSession) => {
        if (chat && typeof chat === 'object') {
          chat.createdAt = new Date(chat.createdAt)
          chat.updatedAt = new Date(chat.updatedAt)
        }
      })
      return persistedState
    }
  } catch (error) {
    console.error('Error loading AI state from IndexedDB:', error)
  }
  return null
}

// Helper function to attempt migration from localStorage
async function tryMigrateFromLocalStorage(
  projectRef: string
): Promise<StoredAiAssistantState | null> {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE(projectRef))
  if (!stored) {
    return null
  }

  let migratedState: StoredAiAssistantState | null = null
  try {
    const parsedFromLocalStorage = JSON.parse(stored, (key, value) => {
      if ((key === 'createdAt' || key === 'updatedAt') && value) {
        return new Date(value)
      }
      return value
    })

    if (parsedFromLocalStorage && typeof parsedFromLocalStorage.chats === 'object') {
      migratedState = {
        projectRef: projectRef,
        open: parsedFromLocalStorage.open ?? false,
        activeChatId: parsedFromLocalStorage.activeChatId,
        chats: parsedFromLocalStorage.chats,
      }
    } else {
      console.warn('Data in localStorage is not in the expected format, ignoring.')
      // Clean up invalid data
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE(projectRef))
    }
  } catch (error) {
    console.error('Failed to parse state from localStorage:', error)
    // Clear potentially corrupted data
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE(projectRef))
  }

  if (migratedState) {
    try {
      await saveAiState(migratedState)
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE(projectRef))
      return migratedState
    } catch (saveError) {
      console.error('Failed to save migrated state to IndexedDB:', saveError)
      return null
    }
  }

  return null
}

// Helper function to ensure an active chat exists or initialize a new one
function ensureActiveChatOrInitialize(state: AiAssistantState) {
  // Check URL param again to override loaded 'open' state if present
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const aiAssistantPanelOpenParam = urlParams.get('aiAssistantPanelOpen')
    if (aiAssistantPanelOpenParam !== null) {
      state.open = aiAssistantPanelOpenParam === 'true'
    }
  }

  // Ensure an active chat exists after loading/migration
  if (!state.activeChatId || !state.chats[state.activeChatId]) {
    const chatIds = Object.keys(state.chats)
    if (chatIds.length > 0) {
      // Select the most recently updated chat
      state.activeChatId = chatIds.sort(
        (a, b) =>
          (state.chats[b].updatedAt?.getTime() || 0) - (state.chats[a].updatedAt?.getTime() || 0)
      )[0]
    } else {
      // If loaded/migrated state had no chats, create a new one
      state.newChat()
    }
  }
}

export const createAiAssistantState = (): AiAssistantState => {
  // Initialize with defaults, loading happens asynchronously in the provider
  const initialState = { ...INITIAL_AI_ASSISTANT }

  // Check URL params for initial 'open' state, overriding any loaded state later if present
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const aiAssistantPanelOpenParam = urlParams.get('aiAssistantPanelOpen')
    if (aiAssistantPanelOpenParam !== null) {
      initialState.open = aiAssistantPanelOpenParam === 'true'
    }
  }

  const state: AiAssistantState = proxy({
    ...initialState, // Spread initial values directly

    resetAiAssistantPanel: () => {
      Object.assign(state, INITIAL_AI_ASSISTANT)
    },

    // Panel visibility
    openAssistant: () => {
      state.open = true
    },

    closeAssistant: () => {
      state.open = false
    },

    toggleAssistant: () => {
      state.open = !state.open
    },

    // Chat management
    get activeChat(): ChatSession | undefined {
      return state.activeChatId ? state.chats[state.activeChatId] : undefined
    },

    newChat: (
      options?: { name?: string } & Partial<
        Pick<AiAssistantData, 'open' | 'initialInput' | 'sqlSnippets' | 'suggestions' | 'tables'>
      >
    ) => {
      const chatId = uuidv4()
      const newChat: ChatSession = {
        id: chatId,
        name: options?.name ?? 'Untitled',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      state.chats = {
        ...state.chats,
        [chatId]: newChat,
      }
      state.activeChatId = chatId

      // Update non-chat related state based on options, falling back to current state, then initial
      state.open = options?.open ?? state.open
      state.initialInput = options?.initialInput ?? INITIAL_AI_ASSISTANT.initialInput
      state.sqlSnippets = options?.sqlSnippets ?? INITIAL_AI_ASSISTANT.sqlSnippets
      state.suggestions = options?.suggestions ?? INITIAL_AI_ASSISTANT.suggestions
      state.tables = options?.tables ?? INITIAL_AI_ASSISTANT.tables

      return chatId
    },

    selectChat: (id: string) => {
      if (id !== state.activeChatId) {
        state.activeChatId = id
      }
    },

    deleteChat: (id: string) => {
      const { [id]: _, ...remainingChats } = state.chats
      state.chats = remainingChats

      if (id === state.activeChatId) {
        const remainingChatIds = Object.keys(remainingChats)
        state.activeChatId = remainingChatIds.length > 0 ? remainingChatIds[0] : undefined
      }
    },

    renameChat: (id: string, name: string) => {
      const chat = state.chats[id]
      if (chat && chat.name !== name) {
        chat.name = name
        chat.updatedAt = new Date()
      }
    },

    clearMessages: () => {
      const chat = state.activeChat
      if (chat) {
        chat.messages = []
        chat.updatedAt = new Date()
        state.suggestions = undefined
        state.sqlSnippets = []
        state.initialInput = ''
      }
    },

    saveMessage: (message: MessageType | MessageType[]) => {
      const chat = state.activeChat
      if (!chat) return

      const existingMessages = chat.messages
      const messagesToAdd = Array.isArray(message)
        ? message.filter(
            (msg) =>
              !existingMessages.some((existing: AssistantMessageType) => existing.id === msg.id)
          )
        : !existingMessages.some((existing: AssistantMessageType) => existing.id === message.id)
          ? [message]
          : []

      if (messagesToAdd.length > 0) {
        chat.messages.push(...messagesToAdd)
        chat.updatedAt = new Date()
      }
    },

    updateMessage: ({
      id,
      resultId,
      results,
    }: {
      id: string
      resultId?: string
      results: any[]
    }) => {
      const chat = state.activeChat
      if (!chat || !resultId) return

      const messageIndex = chat.messages.findIndex((msg) => msg.id === id)

      if (messageIndex !== -1) {
        const msg = chat.messages[messageIndex]
        if (!msg.results) {
          msg.results = {}
        }
        msg.results[resultId] = results
      }
    },

    setSqlSnippets: (snippets: SqlSnippet[]) => {
      state.sqlSnippets = snippets
    },

    clearSqlSnippets: () => {
      state.sqlSnippets = undefined
      state.suggestions = undefined
    },

    getCachedSQLResults: ({ messageId, snippetId }: { messageId: string; snippetId?: string }) => {
      const chat = state.activeChat
      if (!chat || !snippetId) return

      const message = chat.messages.find((msg) => msg.id === messageId)
      const results = (message?.results ?? {})[snippetId]
      return results
    },

    // --- New function to load persisted state ---
    loadPersistedState: (persistedState: StoredAiAssistantState) => {
      state.open = persistedState.open
      state.chats = persistedState.chats
      state.activeChatId = persistedState.activeChatId

      // Check URL param again to override loaded 'open' state if present
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const aiAssistantPanelOpenParam = urlParams.get('aiAssistantPanelOpen')
        if (aiAssistantPanelOpenParam !== null) {
          state.open = aiAssistantPanelOpenParam === 'true'
        }
      }

      // Ensure an active chat exists after loading
      if (!state.activeChat) {
        const chatIds = Object.keys(state.chats)
        if (chatIds.length > 0) {
          // Maybe select the most recently updated? For now, first.
          state.activeChatId = chatIds.sort(
            (a, b) =>
              (state.chats[b].updatedAt?.getTime() || 0) -
              (state.chats[a].updatedAt?.getTime() || 0)
          )[0]
        } else {
          // If loaded state had no chats, create a new one
          state.newChat()
        }
      }
    },

    clearStorage: async () => {
      await clearStorage()
    },
  })

  return state
}

export type AiAssistantState = AiAssistantData & {
  resetAiAssistantPanel: () => void
  openAssistant: () => void
  closeAssistant: () => void
  toggleAssistant: () => void
  activeChat: ChatSession | undefined
  newChat: (
    options?: { name?: string } & Partial<
      Pick<AiAssistantData, 'open' | 'initialInput' | 'sqlSnippets' | 'suggestions' | 'tables'>
    >
  ) => string
  selectChat: (id: string) => void
  deleteChat: (id: string) => void
  renameChat: (id: string, name: string) => void
  clearMessages: () => void
  saveMessage: (message: MessageType | MessageType[]) => void
  updateMessage: (args: { id: string; resultId?: string; results: any[] }) => void
  setSqlSnippets: (snippets: SqlSnippet[]) => void
  clearSqlSnippets: () => void
  getCachedSQLResults: (args: { messageId: string; snippetId?: string }) => any[] | undefined
  loadPersistedState: (persistedState: StoredAiAssistantState) => void
  clearStorage: () => Promise<void>
}

export const AiAssistantStateContext = createContext<AiAssistantState>(createAiAssistantState())

export const AiAssistantStateContextProvider = ({ children }: PropsWithChildren) => {
  const project = useSelectedProject()
  // Initialize state. createAiAssistantState now just sets defaults.
  const [state] = useState(() => createAiAssistantState())

  // Effect to load state from IndexedDB on mount or projectRef change
  useEffect(() => {
    let isMounted = true

    async function loadAndInitializeState() {
      if (!project?.ref || typeof window === 'undefined') {
        if (project?.ref === undefined) {
          state.resetAiAssistantPanel()
        }
        return // Don't load if no projectRef or not in browser
      }

      let loadedState: StoredAiAssistantState | null = null

      // 1. Try loading from IndexedDB
      loadedState = await loadFromIndexedDB(project?.ref)

      // 2. If not in IndexedDB, try migrating from localStorage
      if (!loadedState) {
        loadedState = await tryMigrateFromLocalStorage(project?.ref)
      }

      if (!isMounted) return // Component unmounted during async operations

      // 3. If state was loaded or migrated, update the valtio state
      if (loadedState) {
        state.loadPersistedState(loadedState)
      }

      // 4. Ensure an active chat exists and handle URL overrides
      ensureActiveChatOrInitialize(state)
    }

    loadAndInitializeState()

    return () => {
      isMounted = false
    }
  }, [project?.ref, state])

  // Effect to save state to IndexedDB on changes
  useEffect(() => {
    if (typeof window !== 'undefined' && project?.ref) {
      // Create a debounced version of saveAiState
      const debouncedSaveAiState = debounce(saveAiState, 500)

      const unsubscribe = subscribe(state, () => {
        const snap = snapshot(state)
        // Prepare state for IndexedDB
        const stateToSave: StoredAiAssistantState = {
          projectRef: project?.ref,
          open: snap.open,
          activeChatId: snap.activeChatId,
          chats: snap.chats
            ? Object.entries(snap.chats).reduce((acc, [chatId, chat]) => {
                // Limit messages before saving
                return {
                  ...acc,
                  [chatId]: {
                    ...chat,
                    messages: chat.messages?.slice(-20) || [],
                  },
                }
              }, {})
            : {},
        }
        debouncedSaveAiState(stateToSave)
      })
      // Clean up subscription and cancel any pending saves on unmount or projectRef change
      return () => {
        debouncedSaveAiState.cancel()
        unsubscribe()
      }
    }
    return undefined
  }, [state, project?.ref])

  return (
    <AiAssistantStateContext.Provider value={state}>{children}</AiAssistantStateContext.Provider>
  )
}

export const useAiAssistantStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(AiAssistantStateContext)
  return useSnapshot(state, options)
}
