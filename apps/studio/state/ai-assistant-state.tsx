import type { Message as MessageType } from 'ai/react'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'

type SuggestionsType = {
  title: string
  prompts?: string[]
}

type AssistantMessageType = MessageType & { results?: { [id: string]: any[] } }

type ChatSession = {
  id: string
  name: string
  messages: readonly AssistantMessageType[]
  createdAt: Date
  updatedAt: Date
}

type AiAssistantData = {
  open: boolean
  initialInput: string
  sqlSnippets?: string[]
  suggestions?: SuggestionsType
  tables: { schema: string; name: string }[]
  chats: Record<string, ChatSession>
  activeChatId?: string
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

export const createAiAssistantState = (projectRef: string | undefined) => {
  const getInitialState = (): AiAssistantData => {
    if (typeof window === 'undefined') {
      return INITIAL_AI_ASSISTANT
    }

    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE(projectRef))
    const urlParams = new URLSearchParams(window.location.search)
    const aiAssistantPanelOpenParam = urlParams.get('aiAssistantPanelOpen')

    let parsedAiAssistant = INITIAL_AI_ASSISTANT

    try {
      if (stored) {
        parsedAiAssistant = JSON.parse(stored, (key, value) => {
          if ((key === 'createdAt' || key === 'updatedAt') && value) {
            return new Date(value)
          }
          return value
        })
      }
    } catch {
      // Ignore parsing errors
    }

    return {
      ...parsedAiAssistant,
      open:
        aiAssistantPanelOpenParam !== null
          ? aiAssistantPanelOpenParam === 'true'
          : parsedAiAssistant.open,
    }
  }

  const initialState = getInitialState()

  const state = proxy({
    open: initialState.open,
    initialInput: initialState.initialInput,
    sqlSnippets: initialState.sqlSnippets,
    suggestions: initialState.suggestions,
    tables: initialState.tables,
    chats: initialState.chats,
    activeChatId: initialState.activeChatId,

    resetAiAssistantPanel: () => {
      state.open = state.open
      state.chats = state.chats
      state.activeChatId = state.activeChatId
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
    get activeChat() {
      return state.activeChatId ? state.chats[state.activeChatId] : undefined
    },

    newChat: (
      options?: { name?: string } & Partial<
        Pick<AiAssistantData, 'open' | 'initialInput' | 'sqlSnippets' | 'suggestions' | 'tables'>
      >
    ) => {
      const chatId = crypto.randomUUID()
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

      state.open = options?.open ?? state.open
      state.initialInput = options?.initialInput ?? initialState.initialInput
      state.sqlSnippets = options?.sqlSnippets ?? initialState.sqlSnippets
      state.suggestions = options?.suggestions ?? initialState.suggestions
      state.tables = options?.tables ?? initialState.tables

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

      // If the deleted chat was the active one, select a new active chat
      if (id === state.activeChatId) {
        const remainingChatIds = Object.keys(remainingChats)
        state.activeChatId = remainingChatIds.length > 0 ? remainingChatIds[0] : undefined
      }
    },

    renameChat: (id: string, name: string) => {
      const chat = state.chats[id]
      if (chat && chat.name !== name) {
        state.chats = {
          ...state.chats,
          [id]: {
            ...chat,
            name,
            updatedAt: new Date(),
          },
        }
      }
    },

    clearMessages: () => {
      const chat = state.activeChat
      if (chat) {
        chat.messages = []
        chat.updatedAt = new Date()

        state.sqlSnippets = []
        state.initialInput = ''
      }
    },

    saveMessage: (message: MessageType | MessageType[]) => {
      let chat = state.activeChat
      if (!chat) return

      const existingMessages = chat.messages
      const messagesToAdd = Array.isArray(message)
        ? message.filter((msg) => !existingMessages.some((existing) => existing.id === msg.id))
        : !existingMessages.some((existing) => existing.id === message.id)
          ? [message]
          : []

      if (messagesToAdd.length > 0) {
        chat.messages = [...existingMessages, ...messagesToAdd]
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
      let chat = state.activeChat
      if (!chat || !resultId) return

      const existingMessages = chat.messages
      const updatedMessages = existingMessages.map((msg) => {
        if (msg.id === id) {
          return { ...msg, results: { ...(msg.results ?? {}), [resultId]: results } }
        } else {
          return msg
        }
      })
      chat.messages = updatedMessages
    },

    setSqlSnippets: (snippets: string[]) => {
      state.sqlSnippets = snippets
    },

    // SQL snippets and suggestions
    clearSqlSnippets: () => {
      state.sqlSnippets = undefined
      // Remove suggestions if sqlSnippets were removed
      state.suggestions = undefined
    },

    getCachedSQLResults: ({ messageId, snippetId }: { messageId: string; snippetId?: string }) => {
      let chat = state.activeChat
      if (!chat || !snippetId) return

      const message = chat.messages.find((msg) => msg.id === messageId)
      const results = (message?.results ?? {})[snippetId]
      return results
    },
  })

  // If there's no active chat when the state is created
  // select the first chat, or create a new one if there are none
  if (!state.activeChat) {
    const chatIds = Object.keys(state.chats)
    if (chatIds.length > 0) {
      state.activeChatId = chatIds[0]
    } else {
      state.newChat()
    }
  }

  return state
}

export type AiAssistantState = ReturnType<typeof createAiAssistantState>

export const AiAssistantStateContext = createContext<AiAssistantState>(
  createAiAssistantState(undefined)
)

export const AiAssistantStateContextProvider = ({
  projectRef,
  children,
}: PropsWithChildren<{
  projectRef: string | undefined
}>) => {
  const [state, setState] = useState(() => createAiAssistantState(projectRef))

  useEffect(() => {
    setState(createAiAssistantState(projectRef))
  }, [projectRef])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      return subscribe(state, () => {
        const snap = snapshot(state)
        // Save AI assistant state with limited message history
        const aiAssistantState = {
          open: snap.open,
          activeChatId: snap.activeChatId,
          chats: snap.chats
            ? Object.entries(snap.chats).reduce((acc, [chatId, chat]) => {
                return {
                  ...acc,
                  [chatId]: {
                    ...chat,
                    messages: chat.messages?.slice(-20) || [], // Only keep last 20 messages
                  },
                }
              }, {})
            : {},
        }

        localStorage.setItem(
          LOCAL_STORAGE_KEYS.AI_ASSISTANT_STATE(projectRef),
          JSON.stringify(aiAssistantState)
        )
      })
    }
  }, [state, projectRef])

  return (
    <AiAssistantStateContext.Provider value={state}>{children}</AiAssistantStateContext.Provider>
  )
}

export const useAiAssistantStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(AiAssistantStateContext)

  return useSnapshot(state, options)
}
