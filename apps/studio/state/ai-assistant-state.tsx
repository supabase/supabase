import { Chat, type UIMessage as MessageType } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { proxy, ref, useSnapshot } from 'valtio'

import { constructHeaders } from 'data/fetchers'
import { prepareMessagesForAPI } from 'lib/ai/message-utils'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'

type SuggestionsType = {
  title: string
  prompts?: { label: string; description: string }[]
}

export type AssistantMessageType = MessageType

export type SqlSnippet = string | { label: string; content: string }

export type AssistantModel = 'gpt-5' | 'gpt-5-mini'

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
  activeChatId?: string
  model: AssistantModel
  context: AiAssistantContext
}

const INITIAL_AI_ASSISTANT: AiAssistantData = {
  initialInput: '',
  sqlSnippets: undefined,
  suggestions: undefined,
  tables: [],
  activeChatId: undefined,
  model: 'gpt-5',
  context: {},
}

function createChatInstance(
  state: AiAssistantState,
  options: { id: string; initialMessages: MessageType[] }
) {
  return new Chat<MessageType>({
    id: options.id,
    messages: options.initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      api: `${BASE_PATH}/api/ai/sql/generate-v4`,
      async prepareSendMessagesRequest({ messages, id, ...opts }) {
        const cleanedMessages = prepareMessagesForAPI(messages)
        const headerData = await constructHeaders()
        const authorizationHeader = headerData.get('Authorization')

        // Only send the last message to the server
        const lastMessage = cleanedMessages[cleanedMessages.length - 1]

        return {
          ...opts,
          body: {
            message: lastMessage,
            chatId: id,
            projectRef: state.context.projectRef,
            connectionString: state.context.connectionString,
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

      // Tool calls are handled by the server
    },
    onFinish(result) {
      // Messages are saved by the server in generate-v4 onFinish
    },
  })
}

export const createAiAssistantState = (): AiAssistantState => {
  const initialState = { ...INITIAL_AI_ASSISTANT }

  const state: AiAssistantState = proxy({
    ...initialState,
    chatInstances: {},

    setContext: (context: Partial<AiAssistantContext>) => {
      state.context = { ...state.context, ...context }
    },

    resetAiAssistantPanel: () => {
      Object.assign(state, INITIAL_AI_ASSISTANT)
    },

    setModel: (model: AssistantModel) => {
      state.model = model
    },

    setActiveChatId: (id: string | undefined) => {
      state.activeChatId = id
    },

    getChatInstance: (id: string, initialMessages: MessageType[] = []) => {
      if (!state.chatInstances[id]) {
        state.chatInstances[id] = ref(createChatInstance(state, { id, initialMessages }))
      }
      return state.chatInstances[id]
    },

    setSqlSnippets: (snippets: SqlSnippet[]) => {
      state.sqlSnippets = snippets
    },

    clearSqlSnippets: () => {
      state.sqlSnippets = undefined
      state.suggestions = undefined
    },
  })

  return state
}

export type AiAssistantState = AiAssistantData & {
  resetAiAssistantPanel: () => void
  chatInstances: Record<string, Chat<MessageType>>
  setContext: (context: Partial<AiAssistantContext>) => void
  setModel: (model: AssistantModel) => void
  setActiveChatId: (id: string | undefined) => void
  getChatInstance: (id: string, initialMessages?: MessageType[]) => Chat<MessageType>
  setSqlSnippets: (snippets: SqlSnippet[]) => void
  clearSqlSnippets: () => void
}

export const AiAssistantStateContext = createContext<AiAssistantState>(createAiAssistantState())

export const AiAssistantStateContextProvider = ({ children }: PropsWithChildren) => {
  const [state] = useState(() => createAiAssistantState())

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
