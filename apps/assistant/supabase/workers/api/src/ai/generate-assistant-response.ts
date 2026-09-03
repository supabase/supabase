import * as ai from 'ai'
import {
  convertToModelMessages,
  isStepCount,
  type LanguageModel,
  type ModelMessage,
  type SystemModelMessage,
  type ToolSet,
  type UIMessage,
} from 'ai'
import { source } from 'common-tags'

import { buildAssistantContextMessages, NO_SCHEMA_ACCESS_MESSAGE } from './assistant-context'
import { prepareMessagesForModel } from './generate-assistant-response.utils'
import type { AiOptInLevel } from './opt-in'
import { CHAT_PROMPT, GENERAL_PROMPT, LIMITATIONS_PROMPT, SECURITY_PROMPT } from './prompts'

export async function generateAssistantResponse({
  messages: rawMessages,
  model,
  tools,
  aiOptInLevel = 'schema_and_log_and_data',
  getSchemas,
  projectRef,
  chatName,
  supportMode,
  includesLogsSnippets,
  systemProviderOptions,
  providerOptions,
  abortSignal,
}: {
  messages: UIMessage[]
  model: LanguageModel
  tools: ToolSet
  aiOptInLevel?: AiOptInLevel
  getSchemas?: () => Promise<string>
  projectRef?: string
  chatName?: string
  supportMode?: boolean
  /** Whether any user message in the conversation attached a logs (ClickHouse) query. */
  includesLogsSnippets?: boolean
  systemProviderOptions?: Record<string, any>
  providerOptions?: Record<string, any>
  abortSignal?: AbortSignal
}) {
  const messages = prepareMessagesForModel(rawMessages, aiOptInLevel)

  const schemasString = getSchemas ? await getSchemas() : NO_SCHEMA_ACCESS_MESSAGE

  const system = source`
    ${GENERAL_PROMPT}
    ${CHAT_PROMPT}
    ${SECURITY_PROMPT}
    ${LIMITATIONS_PROMPT}

    ## Available Knowledge

    Before writing SQL or answering questions about the following topics, call \`load_knowledge\` to load detailed knowledge:
    - \`pg_best_practices\` — PostgreSQL best practices. Always load before writing any SQL, even simple queries.
    - \`logs\` — ClickHouse SQL against the project's logs table. Always load before calling \`query_logs\`.
    - \`rls\` — Row Level Security policies for database tables.
    - \`storage\` — Supabase Storage buckets, public/private bucket access, and \`storage.objects\` policies. Always load before creating Storage buckets or \`storage.objects\` policies.
    - \`edge_functions\` — Supabase Edge Functions
    - \`realtime\` — Supabase Realtime
  `

  const systemMessage: SystemModelMessage = {
    role: 'system',
    content: system,
    ...(systemProviderOptions && { providerOptions: systemProviderOptions }),
  }

  const coreMessages: ModelMessage[] = [
    ...buildAssistantContextMessages({
      projectRef,
      chatName,
      schemasString,
      supportMode,
      includesLogsSnippets,
    }),
    ...(await convertToModelMessages(messages)),
  ]

  return ai.streamText({
    model,
    instructions: systemMessage,
    stopWhen: isStepCount(10),
    messages: coreMessages,
    ...(providerOptions && { providerOptions }),
    tools,
    ...(abortSignal && { abortSignal }),
  } satisfies Parameters<typeof ai.streamText>[0])
}
