import { Chat, type UIMessage as MessageType } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { DBSchema, IDBPDatabase, openDB } from 'idb'
import { debounce } from 'lodash'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { proxy, ref, snapshot, subscribe, useSnapshot } from 'valtio'

import { constructHeaders } from 'data/fetchers'
import { prepareMessagesForAPI } from 'lib/ai/message-utils'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

type SuggestionsType = {
  title: string
  prompts?: { label: string; description: string }[]
}

export type AssistantMessageType = MessageType

export type SqlSnippet = string | { label: string; content: string }

export type AssistantModel = 'gpt-5' | 'gpt-5-mini'

type ChatSession = {
  id: string
  name: string
  messages: AssistantMessageType[]
  createdAt: Date
  updatedAt: Date
}

export type AiAssistantContext = {
  projectRef?: string
  orgSlug?: string
  connectionString?: string
}

type AiAssistantData = {
  initialInput: string
  sqlSnippets?: SqlSnippet[]
  suggestions?: SuggestionsType
  tables: { schema: string; name: string }[]
  chats: Record<string, ChatSession>
  activeChatId?: string
  model: AssistantModel
  context: AiAssistantContext
}

// Data structure stored in IndexedDB
type StoredAiAssistantState = {
  projectRef: string
  activeChatId?: string
  chats: Record<string, ChatSession>
  model?: AssistantModel
}

const INITIAL_AI_ASSISTANT: AiAssistantData = {
  initialInput: '',
  sqlSnippets: undefined,
  suggestions: undefined,
  tables: [],
  chats: {},
  activeChatId: undefined,
  model: 'gpt-5',
  context: {},
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

// Helper function to sanitize objects to ensure they're cloneable
// Issue due to addToolResult
function sanitizeForCloning(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  return JSON.parse(JSON.stringify(obj))
}

// Helper function to load state from IndexedDB
async function loadFromIndexedDB(projectRef: string): Promise<StoredAiAssistantState | null> {
  try {
    const persistedState = await getAiState(projectRef)
    if (persistedState) {
      // Revive dates and sanitize message data
      Object.values(persistedState.chats).forEach((chat: ChatSession) => {
        if (chat && typeof chat === 'object') {
          chat.createdAt = new Date(chat.createdAt)
          chat.updatedAt = new Date(chat.updatedAt)

          // Sanitize message parts to remove proxy objects
          if (chat.messages) {
            chat.messages.forEach((message: any) => {
              if (message.parts) {
                message.parts = message.parts.map((part: any) => sanitizeForCloning(part))
              }
            })
          }
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
        activeChatId: parsedFromLocalStorage.activeChatId,
        chats: parsedFromLocalStorage.chats,
        model: parsedFromLocalStorage.model ?? INITIAL_AI_ASSISTANT.model,
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

function createChatInstance(
  state: AiAssistantState,
  options: { id: string; initialMessages: MessageType[] }
) {
  return new Chat<MessageType>({
    id: options.id,
    messages: options.initialMessages.map((message) => sanitizeForCloning(message)),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      api: `${BASE_PATH}/api/ai/sql/generate-v4`,
      fetch: async (url, init) => {
        const response = await globalThis.fetch(url as RequestInfo, init)
        const spanId = response.headers.get('x-braintrust-span-id')
        if (spanId) {
          state.pendingSpanIds[options.id] = spanId
        }
        return response
      },
      async prepareSendMessagesRequest({ messages, ...opts }) {
        const cleanedMessages = prepareMessagesForAPI(messages)
        const headerData = await constructHeaders()
        const authorizationHeader = headerData.get('Authorization')

        // Get the chat specific to this request to ensure we have the correct name
        const chat = state.chats[options.id]

        return {
          ...opts,
          body: {
            messages: cleanedMessages,
            projectRef: state.context.projectRef,
            connectionString: state.context.connectionString,
            chatId: options.id,
            chatName: chat?.name,
            orgSlug: state.context.orgSlug,
            context: state.context,
            model: state.model,
            ...opts.body,
          },
          ...(IS_PLATFORM ? { headers: { Authorization: authorizationHeader ?? '' } } : {}),
        }
      },
    }),
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return
      }

      if (toolCall.toolName === 'rename_chat') {
        const { newName } = toolCall.input as { newName: string }

        if (options.id && newName?.trim()) {
          state.renameChat(options.id, newName.trim())
        }
      }
    },
    onFinish(result) {
      // Sync messages back to state
      const chatInstance = state.chatInstances[options.id]
      if (chatInstance) {
        const messages = chatInstance.messages
        const chat = state.chats[options.id]
        if (chat) {
          chat.messages = messages as AssistantMessageType[]
          chat.updatedAt = new Date()
        }

        // Associate pending span ID with the last assistant message
        const pendingSpanId = state.pendingSpanIds[options.id]
        if (pendingSpanId) {
          const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
          if (lastAssistantMsg) {
            state.messageSpanIds[lastAssistantMsg.id] = pendingSpanId
          }
          delete state.pendingSpanIds[options.id]
        }
      }
    },
  })
}

export const createAiAssistantState = (): AiAssistantState => {
  // Initialize with defaults, loading happens asynchronously in the provider
  const initialState = { ...INITIAL_AI_ASSISTANT }

  const state: AiAssistantState = proxy({
    ...initialState, // Spread initial values directly
    chatInstances: {},
    pendingSpanIds: {},
    messageSpanIds: {},

    setContext: (context: Partial<AiAssistantContext>) => {
      state.context = { ...state.context, ...context }
    },

    resetAiAssistantPanel: () => {
      Object.assign(state, INITIAL_AI_ASSISTANT)
    },

    setModel: (model: AssistantModel) => {
      state.model = model
    },

    // Chat management
    get activeChat(): ChatSession | undefined {
      return state.activeChatId ? state.chats[state.activeChatId] : undefined
    },

    newChat: (
      options?: { name?: string; initialMessage?: string } & Partial<
        Pick<AiAssistantData, 'initialInput' | 'sqlSnippets' | 'suggestions' | 'tables'>
      >
    ) => {
      const chatId = uuidv4()
      const newChat: ChatSession = {
        id: chatId,
        name: options?.name ?? 'New chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      state.chats = {
        ...state.chats,
        [chatId]: newChat,
      }
      state.activeChatId = chatId

      // Create new chat instance
      const chatInstance = createChatInstance(state, { id: chatId, initialMessages: [] })

      state.chatInstances[chatId] = ref(chatInstance)

      // If initialMessage is provided, append it to the chat instance
      if (options?.initialMessage) {
        chatInstance.sendMessage({
          text: options.initialMessage,
        })
      }

      // Update non-chat related state based on options, falling back to current state, then initial
      state.initialInput = options?.initialInput ?? INITIAL_AI_ASSISTANT.initialInput
      state.sqlSnippets = options?.sqlSnippets ?? INITIAL_AI_ASSISTANT.sqlSnippets
      state.suggestions = options?.suggestions ?? INITIAL_AI_ASSISTANT.suggestions
      state.tables = options?.tables ?? INITIAL_AI_ASSISTANT.tables

      return chatId
    },

    selectChat: (id: string) => {
      if (id !== state.activeChatId) {
        state.activeChatId = id
        const chat = state.chats[id]
        if (chat) {
          if (!state.chatInstances[id]) {
            state.chatInstances[id] = ref(
              createChatInstance(state, { id, initialMessages: chat.messages })
            )
          }
        }
      }
    },

    deleteChat: (id: string) => {
      const { [id]: _, ...remainingChats } = state.chats
      state.chats = remainingChats

      if (id === state.activeChatId) {
        const remainingChatIds = Object.keys(remainingChats)
        state.activeChatId = remainingChatIds.length > 0 ? remainingChatIds[0] : undefined

        if (state.activeChatId) {
          const chat = state.chats[state.activeChatId]
          if (!state.chatInstances[state.activeChatId]) {
            state.chatInstances[state.activeChatId] = ref(
              createChatInstance(state, { id: state.activeChatId, initialMessages: chat.messages })
            )
          }
        }
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

    deleteMessagesAfter: (id: string, { includeSelf = true } = {}) => {
      const chat = state.activeChat
      if (!chat) return

      const messageIndex = chat.messages.findIndex((msg) => msg.id === id)
      if (messageIndex === -1) return

      // Delete all messages from the target message (optionally including) to the end
      const startIndex = includeSelf ? messageIndex : messageIndex + 1
      chat.messages.splice(startIndex)
      chat.updatedAt = new Date()
    },

    saveMessage: (message: MessageType | MessageType[]) => {
      const chat = state.activeChat
      if (!chat) return

      const incomingMessages = Array.isArray(message) ? message : [message]

      const messagesToAdd: AssistantMessageType[] = []

      incomingMessages.forEach((msg) => {
        const index = chat.messages.findIndex((existing) => existing.id === msg.id)

        if (index !== -1) {
          state.updateMessage(msg)
        } else {
          messagesToAdd.push(msg as AssistantMessageType)
        }
      })

      if (messagesToAdd.length > 0) {
        chat.messages.push(...messagesToAdd)
        chat.updatedAt = new Date()
      }
    },

    updateMessage: (updatedMessage: MessageType) => {
      const chat = state.activeChat
      if (!chat) return

      const messageIndex = chat.messages.findIndex((msg) => msg.id === updatedMessage.id)
      if (messageIndex !== -1) {
        chat.messages[messageIndex] = updatedMessage as AssistantMessageType
        chat.updatedAt = new Date()
      }
    },

    setSqlSnippets: (snippets: SqlSnippet[]) => {
      state.sqlSnippets = snippets
    },

    clearSqlSnippets: () => {
      state.sqlSnippets = undefined
      state.suggestions = undefined
    },

    // --- New function to load persisted state ---
    loadPersistedState: (persistedState: StoredAiAssistantState) => {
      state.chats = persistedState.chats
      state.activeChatId = persistedState.activeChatId
      state.model = persistedState.model ?? INITIAL_AI_ASSISTANT.model

      // Ensure an active chat exists after loading
      if (!state.activeChat) {
        const chatIds = Object.keys(state.chats)
        if (chatIds.length > 0) {
          // Select the most recently updated chat
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

      // Initialize chat instance for the active chat
      if (
        state.activeChatId &&
        state.chats[state.activeChatId] &&
        !state.chatInstances[state.activeChatId]
      ) {
        state.chatInstances[state.activeChatId] = ref(
          createChatInstance(state, {
            id: state.activeChatId,
            initialMessages: state.chats[state.activeChatId].messages,
          })
        )
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
  activeChat: ChatSession | undefined
  chatInstances: Record<string, Chat<MessageType>>
  pendingSpanIds: Record<string, string>
  messageSpanIds: Record<string, string>
  setContext: (context: Partial<AiAssistantContext>) => void
  setModel: (model: AssistantModel) => void
  newChat: (
    options?: { name?: string; initialMessage?: string } & Partial<
      Pick<AiAssistantData, 'initialInput' | 'sqlSnippets' | 'suggestions' | 'tables'>
    >
  ) => string
  selectChat: (id: string) => void
  deleteChat: (id: string) => void
  renameChat: (id: string, name: string) => void
  clearMessages: () => void
  deleteMessagesAfter: (id: string, options?: { includeSelf?: boolean }) => void
  saveMessage: (message: MessageType | MessageType[]) => void
  updateMessage: (message: MessageType) => void
  setSqlSnippets: (snippets: SqlSnippet[]) => void
  clearSqlSnippets: () => void
  loadPersistedState: (persistedState: StoredAiAssistantState) => void
  clearStorage: () => Promise<void>
}

export const AiAssistantStateContext = createContext<AiAssistantState>(createAiAssistantState())

export const AiAssistantStateContextProvider = ({ children }: PropsWithChildren) => {
  const { data: project } = useSelectedProjectQuery()
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
          activeChatId: snap.activeChatId,
          model: snap.model,
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

export const useAiAssistantState = () => {
  const state = useContext(AiAssistantStateContext)
  return state
}
