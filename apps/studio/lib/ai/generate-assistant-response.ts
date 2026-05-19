import * as ai from 'ai'
import {
  convertToModelMessages,
  isToolUIPart,
  stepCountIs,
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
import { IS_TRACING_ENABLED } from '@/lib/ai/braintrust-logger'
import { CHAT_PROMPT, GENERAL_PROMPT, LIMITATIONS_PROMPT, SECURITY_PROMPT } from '@/lib/ai/prompts'
import { sanitizeMessagePart } from '@/lib/ai/tools/tool-sanitizer'

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
  userId,
  orgId,
  planId,
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
  userId?: string
  orgId?: number
  planId?: string
  requestedModel?: string
  systemProviderOptions?: Record<string, any>
  providerOptions?: Record<string, any>
  abortSignal?: AbortSignal
  onSpanCreated?: (spanId: string) => void
}) {
  const shouldTrace = allowTracing ?? IS_TRACING_ENABLED

  const run = async (span?: Span) => {
    // Only returns last 7 messages
    // Filters out tools with invalid states
    // Filters out tool outputs based on opt-in level
    const messages = (rawMessages || []).slice(-7).map((msg) => {
      if (msg && msg.role === 'assistant' && 'results' in msg) {
        const cleanedMsg = { ...msg }
        delete cleanedMsg.results
        return cleanedMsg
      }
      if (msg && msg.role === 'assistant' && msg.parts) {
        const cleanedParts = msg.parts
          .filter((part) => {
            if (isToolUIPart(part)) {
              const invalidStates = ['input-streaming', 'input-available', 'output-error']
              return !invalidStates.includes(part.state)
            }
            return true
          })
          .map((part) => {
            return sanitizeMessagePart(part, aiOptInLevel)
          })
        return { ...msg, parts: cleanedParts }
      }
      return msg
    })

    const schemasString =
      aiOptInLevel !== 'disabled' && getSchemas
        ? shouldTrace
          ? await traced(async () => getSchemas(), { name: 'getSchemas', type: 'function' })
          : await getSchemas()
        : "You don't have access to any schemas."

    // Important: do not use dynamic content in the system prompt or Bedrock will not cache it
    const system = source`
      ${GENERAL_PROMPT}
      ${CHAT_PROMPT}
      ${SECURITY_PROMPT}
      ${LIMITATIONS_PROMPT}

      ## Available Knowledge

      Before writing SQL or answering questions about the following topics, call \`load_knowledge\` to load detailed knowledge:
      - \`pg_best_practices\` — PostgreSQL best practices. Always load before writing any SQL, even simple queries.
      - \`rls\` — Row Level Security policies
      - \`edge_functions\` — Supabase Edge Functions
      - \`realtime\` — Supabase Realtime
    `

    const hasProjectContext =
      projectRef || chatName || schemasString !== "You don't have access to any schemas."

    const assistantContent = hasProjectContext
      ? `The user's current project is ${projectRef || 'unknown'}. Their available schemas are: ${schemasString}. The current chat name is: ${chatName || 'unnamed'}.`
      : undefined

    const systemMessage: SystemModelMessage = {
      role: 'system',
      content: system,
      ...(systemProviderOptions && { providerOptions: systemProviderOptions }),
    }

    const coreMessages: ModelMessage[] = [
      ...(assistantContent
        ? [
            {
              role: 'assistant' as const,
              content: assistantContent,
            },
          ]
        : []),
      ...(await convertToModelMessages(messages)),
    ]

    const streamTextFn = shouldTrace ? tracedStreamText : ai.streamText

    return streamTextFn({
      model,
      system: systemMessage,
      stopWhen: stepCountIs(5),
      messages: coreMessages,
      ...(providerOptions && { providerOptions }),
      tools,
      ...(abortSignal && { abortSignal }),
      ...(span && {
        onFinish: ({ steps, finishReason }) => {
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
    // startSpan instead of traced() so we control when the span closes via onFinish.
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
