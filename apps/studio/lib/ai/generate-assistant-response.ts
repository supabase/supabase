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
import { startSpan, traced, withCurrent, wrapAISDK, type Span } from 'braintrust'
import { source } from 'common-tags'

import type { AssistantEvalInput } from '@/evals/scorer'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { buildAssistantContextMessages, NO_SCHEMA_ACCESS_MESSAGE } from '@/lib/ai/assistant-context'
import { IS_TRACING_ENABLED } from '@/lib/ai/braintrust-logger'
import { prepareMessagesForModel } from '@/lib/ai/generate-assistant-response.utils'
import {
  CHAT_PROMPT,
  GENERAL_PROMPT,
  LIMITATIONS_PROMPT,
  NOTEBOOKS_PROMPT,
  SECURITY_PROMPT,
} from '@/lib/ai/prompts'

const { streamText: tracedStreamText } = wrapAISDK(ai)

export async function generateAssistantResponse({
  messages: rawMessages,
  model,
  tools,
  aiOptInLevel = 'schema',
  getSchemas,
  projectRef,
  chatId,
  chatName,
  allowTracing,
  supportMode,
  userId,
  orgId,
  planId,
  includesLogsSnippets,
  isExplorerEnabled,
  systemProviderOptions,
  providerOptions,
  requestedModel,
  abortSignal,
  onSpanCreated,
}: {
  messages: UIMessage[]
  model: LanguageModel
  tools: ToolSet
  aiOptInLevel?: AiOptInLevel
  getSchemas?: () => Promise<string>
  projectRef?: string
  chatId?: string
  chatName?: string
  allowTracing?: boolean
  supportMode?: boolean
  userId?: string
  orgId?: number
  planId?: string
  /** Whether any user message in the conversation attached a logs (ClickHouse) query. */
  includesLogsSnippets?: boolean
  isExplorerEnabled?: boolean
  requestedModel?: string
  systemProviderOptions?: Record<string, any>
  providerOptions?: Record<string, any>
  abortSignal?: AbortSignal
  onSpanCreated?: (spanId: string) => void
}) {
  const shouldTrace = allowTracing ?? IS_TRACING_ENABLED

  const run = async (span?: Span) => {
    const messages = prepareMessagesForModel(rawMessages, aiOptInLevel)

    const schemasString =
      aiOptInLevel !== 'disabled' && getSchemas
        ? shouldTrace
          ? await traced(async () => getSchemas(), { name: 'getSchemas', type: 'function' })
          : await getSchemas()
        : NO_SCHEMA_ACCESS_MESSAGE

    // Important: do not use per-request dynamic content in the system prompt or Bedrock will
    // not cache it. isExplorerEnabled is a per-user flag, not per-request, so it only produces
    // two prompt variants (on/off) rather than defeating caching.
    const system = source`
      ${GENERAL_PROMPT}
      ${CHAT_PROMPT}
      ${isExplorerEnabled ? NOTEBOOKS_PROMPT : ''}
      ${SECURITY_PROMPT}
      ${LIMITATIONS_PROMPT}

      ## Available Knowledge

      Before writing SQL or answering questions about the following topics, call \`load_knowledge\` to load detailed knowledge:
      - \`pg_best_practices\` — PostgreSQL best practices. Always load before writing any SQL, even simple queries.
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

    const streamTextFn = shouldTrace ? tracedStreamText : ai.streamText

    return streamTextFn({
      model,
      instructions: systemMessage,
      stopWhen: isStepCount(10),
      messages: coreMessages,
      ...(providerOptions && { providerOptions }),
      tools,
      ...(abortSignal && { abortSignal }),
      ...(span && {
        onEnd: ({ steps, finishReason }) => {
          const metadata: Record<string, unknown> = {
            isFinalStep: finishReason === 'stop',
          }
          for (const step of steps) {
            for (const toolCall of step.toolCalls) {
              if (toolCall.toolName === 'rename_chat') {
                const { newName } = toolCall.input as { newName: string }
                metadata.chatName = newName
              }
            }
          }
          span.log({ metadata })
          span.end()
        },
      }),
    } satisfies Parameters<typeof ai.streamText>[0])
  }

  if (shouldTrace) {
    // startSpan instead of traced() so we control when the span closes via onEnd.
    // Scorers read from child spans (LLM + tool) in the trace rather than a root span output field.
    const span = startSpan({ name: 'generateAssistantResponse', type: 'function' })
    onSpanCreated?.(span.id)

    const lastUserMessage = rawMessages.findLast((m) => m.role === 'user')
    const lastUserText = lastUserMessage?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('\n')

    span.log({
      input: { prompt: lastUserText ?? '' } satisfies AssistantEvalInput,
      metadata: {
        projectRef,
        chatId,
        chatName,
        aiOptInLevel,
        userId,
        orgId,
        planId,
        requestedModel,
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF,
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
      },
    })

    return withCurrent(span, () => run(span))
  }

  return run()
}
